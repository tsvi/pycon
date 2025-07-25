---

marp: true
theme: pycon-talk-theme
title: Beyond Constants: Mastering Python Enums

---

<div class="title-slide">

# Beyond Constants: Mastering Python Enums

</div>

<div class="subtitle-info">
Tsvi Mostovicz, Intel | Pycon IL 2025 | Cinema City Glilot, Israel
</div>

---

<!-- _backgroundImage: url('assets/tsvi-sunset-meitar.png') -->
<!-- _backgroundSize: cover -->
<!-- _backgroundPosition: center center -->

# Bio

<div class="bio-circle">

<div class="bio-item" data-marpit-fragment="1">
<img src="assets/belgium-flag.svg" alt="Belgium Flag">
</div>

<div class="bio-item" data-marpit-fragment="2">
<img src="assets/jewish-calendar.png" alt="Jewish Calendar App">
</div>

<div class="bio-item" data-marpit-fragment="3">
<img src="assets/home-assistant.png" alt="Home Assistant">
</div>

<div class="bio-item" data-marpit-fragment="4">
<img src="assets/intel.png" alt="Intel">
</div>

<div class="bio-item" data-marpit-fragment="5">
<img src="assets/icore-processor.webp" alt="Intel Core Processor">
</div>

</div>

---

# What This Talk Is About

<div data-marpit-fragment="1">

- Enums: Not just glorified constants

</div>

<div data-marpit-fragment="2">

- Adding metadata and methods to enums

</div>

<div data-marpit-fragment="3">

- Dynamic enum creation

</div>

<div data-marpit-fragment="4">

- The dangers of enums

</div>

---

# Basic Enum Refresher

```python
from enum import Enum

class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3

# Usage
print(Color.RED)        # Color.RED
print(Color.RED.name)   # RED
print(Color.RED.value)  # 1
```

---

# Adding Metadata to Enums

```python
from enum import IntEnum

class Months(IntEnum):
    TISHREI = 1, 30
    MARCHESHVAN = 2, lambda year: 30 if long_cheshvan(year) else 29
    KISLEV = 3, lambda year: 30 if not short_kislev(year) else 29
    ADAR = 6, 29  # Regular year
    ADAR_I = 7, 30  # Leap year first Adar  
    ADAR_II = 8, 29  # Leap year second Adar
    
    def __new__(cls, value, days):
        obj = int.__new__(cls, value)
        obj._value_ = value
        obj.length = days
        return obj

# Usage
print(Months.TISHREI.length)     # 30
print(Months.ADAR.value)         # 6
```

---

# Adding Methods to Enums

```python
class Months(IntEnum):
    TISHREI = 1, 30
    MARCHESHVAN = 2, lambda year: 30 if long_cheshvan(year) else 29
    KISLEV = 3, lambda year: 30 if not short_kislev(year) else 29
    ADAR = 6, 29
    # ... other months
    
    def __new__(cls, value, days):
        obj = int.__new__(cls, value)
        obj._value_ = value
        obj.length = days
        return obj
    
    def days(self, year=None):
        """Return the number of days in this month."""
        if callable(self.length):
            return self.length(year)
        return self.length

# Usage
print(Months.TISHREI.days())           # 30
print(Months.MARCHESHVAN.days(5784))   # 30 (long Cheshvan in this year)
```

---

# Real-world Example: Hebrew Calendar

```python
class Months(IntEnum):
    TISHREI = 1, 30
    MARCHESHVAN = 2, lambda year: 30 if long_cheshvan(year) else 29
    KISLEV = 3, lambda year: 30 if not short_kislev(year) else 29
    ADAR = 6, 29  # Regular year
    ADAR_I = 7, 30  # Leap year first Adar
    ADAR_II = 8, 29  # Leap year second Adar
    # ... other months

    def __new__(cls, value, days):
        obj = int.__new__(cls, value)
        obj._value_ = value
        obj.length = days
        return obj

    def days(self, year=None):
        if callable(self.length):
            return self.length(year)
        return self.length

# Usage
print(Months.MARCHESHVAN.days(5785))  # 30 (long Cheshvan)
print(Months.KISLEV.days(5785))       # 29 (short Kislev)
```

---

# Dynamic Enum Creation

```python
from enum import StrEnum
import json

# Read configuration from file
with open("config.json") as f:
    config_data = json.load(f)

# Create enum dynamically
ConfigEnum = StrEnum("ConfigEnum", config_data)

# Example config.json:
# {
#   "SERVER": "production_server",
#   "DATABASE": "main_db", 
#   "API_KEY": "secret_key"
# }

# Usage
print(ConfigEnum.SERVER)     # ConfigEnum.SERVER
print(ConfigEnum.SERVER.value)  # "production_server"

# Type-safe access
def get_config(key):
    return ConfigEnum[key]  # Raises KeyError if invalid
```

---

---

# Singleton Pitfalls: The ADAR Problem

```python
class Months(IntEnum):
    TISHREI = 1
    MARCHESHVAN = 2
    KISLEV = 3
    TEVET = 4
    SHVAT = 5
    ADAR = 6      # Regular Adar (non-leap years)
    ADAR_I = 7    # First Adar (leap years)
    ADAR_II = 8   # Second Adar (leap years)
    NISAN = 9
    # ... more months

# Calculation function that seems innocent
def months_until_passover(current_month):
    """Calculate months from current month to Nisan (Passover)."""
    return Months.NISAN.value - current_month.value

# In a leap year, using ADAR_II:
print(months_until_passover(Months.ADAR_II))  # 9 - 8 = 1 month ✓
print(months_until_passover(Months.ADAR))     # 9 - 6 = 3 months ✗

# The problem: ADAR (6) vs ADAR_II (8) have different values!
# This breaks calculations that assume sequential month numbering.
```

---

# Solution: Be Careful with Calculations

<div data-marpit-fragment="1">

Don't assume enum values are sequential

```python
# ❌ BAD: Assuming sequential values
def months_until_passover(current_month):
    return Months.NISAN.value - current_month.value

# ✅ GOOD: Use position in actual calendar
def months_until_passover(current_month, year):
    months_in_year = get_months_for_year(year)  # Handle leap years
    current_pos = months_in_year.index(current_month)
    nisan_pos = months_in_year.index(Months.NISAN)
    return (nisan_pos - current_pos) % len(months_in_year)

# ✅ GOOD: Or use a mapping
MONTH_POSITIONS = {
    # Regular year positions
    5783: {Months.ADAR: 6, Months.NISAN: 7},
    # Leap year positions  
    5784: {Months.ADAR_I: 6, Months.ADAR_II: 7, Months.NISAN: 8}
}
```

</div>

---

# When to Use Enhanced Enums

<div data-marpit-fragment="1">

✅ DO use when:

- The behavior is intrinsic to the enum member
- The metadata is constant and well-defined
- You need a closed set of related constants with behavior

</div>

<div data-marpit-fragment="2">

❌ DON'T use when:

- The behavior could change at runtime
- You need mutable state
- The relationship between constants is complex
- It leads to circular dependencies

</div>

---

<div style="font-style: italic; font-size: 1.2em; color: #5C4D7D;">

> "Simple is better than complex. Complex is better than complicated."
> — The Zen of Python (PEP20)

</div>

<div data-marpit-fragment="1" style="margin-top: 1em;">
Enums should make your code more readable, not less!
</div>

---

# Real-world Applications

## Hebrew Calendar Library

- **Variable month lengths** based on calculations
- **Leap year handling** with different month sets  
- **Sequential numbering pitfalls** with ADAR variants

## Configuration Management

- **Dynamic enum creation** from JSON/YAML files
- **Type safety** for configuration keys
- **Runtime flexibility** with compile-time validation

## Key Takeaway

Enums are powerful but **beware of calculation assumptions** when values aren't sequential!

---

# Recap

<div data-marpit-fragment="1">

- Enums can be powerful domain modeling tools

</div>

<div data-marpit-fragment="2">

- Adding metadata and methods makes code more expressive

</div>

<div data-marpit-fragment="3">

- Dynamic enum creation enables flexible configuration

</div>

<div data-marpit-fragment="4">

- Beware of singleton pitfalls, especially in tests

</div>

---

# Thank you

<div style="display: flex; align-items: center; justify-content: center;">

<div style="text-align: center; margin-right: 20px; margin-top: 75px;">
<img src="assets/linkedin-qr.png"
     alt="LinkedIn QR Code"
     style="height: 150px; border: 2px solid #0077b5; border-radius: 10px;">
<br><b>LinkedIn:</b> <a href="https://linkedin.com/in/tsvim">linkedin.com/in/tsvim</a>
</div>
<img src="assets/github-qr.png"
     alt="GitHub QR Code"
     style="height: 150px; border: 2px solid #333; border-radius: 10px;">
<div style="text-align: center; margin-left: 20px; margin-top: 75px;">
<br><b>GitHub:</b> <a href="https://github.com/tsvi">github.com/tsvi</a>
</div>

</div>

---

# Resources

- Python Enum Documentation: <https://docs.python.org/3/library/enum.html>
- PEP 435 -- Adding an Enum type to the Python standard library: <https://peps.python.org/pep-0435/>
- hdate library: <https://github.com/py-libhdate/py-libhdate>
- "Fluent Python" by Luciano Ramalho (covers enum patterns)
- Real Python - Python's Enum Type: <https://realpython.com/python-enum/>
