---

marp: true
theme: pycon-talk-theme
title: Beyond Constants: Mastering Python Enums
paginate: true

---

# Beyond Constants: Mastering Python Enums

Tsvi Mostovicz, Intel | Pycon IL 2025 | Cinema City Glilot, Israel

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

* 🤔 Why Enums?
* 📚 Basic Enums: A quick refresher
* 🚀 Advanced Enums: Adding metadata and methods to enums
* ⚡ Advanced Enums: Dynamic enum creation
* ⚠️ The dangers of using enums

---

# 🤔 Why Enums - a historical recap (1/4)

## We started with raw values

```python --no-line-number
if status == 1:
   print("Done!")
```

---

# 🤔 Why Enums - a historical recap (2/4)

## Make our code readable

```python --no-line-number
if status == "DONE":
   print("Done!")
```

---

# 🤔 Why Enums - a historical recap (3/4)

## Let's use constants to avoid typos

```python --no-line-number
DONE = "done"

if status == DONE:
   print("Done!")
```

---

# 🤔 Why Enums - a historical recap (4/4)

## We should group the related constants

```python --no-line-number
class Status:
    DONE = 1
    ERROR = 2

if status == Status.DONE:
   print("Done!")
```

---

# Enums: Add validation

```python --no-line-number
class Status(Enum):
    DONE = 1
    ERROR = 2

value = Status(1)    # ✅ Works
value = Status(5)    # ❌ Error - not  a valid status
```

---

# ... and introspection 🎉

```python --no-line-number
>>> [x.name for x in Status]
['DONE', 'ERROR']

>>> [x.value for x in Status]
[1, 2]
```

## Available since Python 3.4 (That's more than 10 years ago 😉)

---

# 📚 Basic Enums: A quick refresher

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
class Months(Enum):
    TISHREI = 1, 30
    TEVET = 4, 29
    
    def __new__(cls, value, length):
        obj = object.__new__(cls, value)
        obj._value_ = value
        obj.length = length
        return obj

# Usage
print(Months.TISHREI.length)     # 30
print(Months.TEVET.value)         # 4
```

---

# Adding Methods to Enums

```python
class Months(Enum):

    def next_month(self, year) -> Months:
        """Return the next month."""
        if self == Months.ELUL:
            return Months.TISHREI
        if self in {Months.ADAR, Months.ADAR_II}:
            return Months.NISAN
        if is_leap_year(year) and self == Months.SHVAT:
            return Months.ADAR_I
        return Months(self._value_ + 1)

# Usage
print(Months.ELUL.next_month())        # TISHREI
print(Months.SHVAT.next_month(5784))   # ADAR_I
```

---

# Dynamic Enum Creation

```python
with open("config.json") as f:
    config_data = json.load(f)

ConfigEnum = StrEnum("ConfigEnum", config_data)

# Example config.json:
# {"SERVER": "product_a", "CLIENT": "product_b"}

# Usage
print(ConfigEnum.SERVER.value)  # "product_a"

# Type-safe access
def get_config(key):
    return ConfigEnum[key]  # Raises KeyError if invalid
```

---

# ⚠️ The dangers of using enums

---

# Singletons

* These are *NOT* your regular classes
* Changing attributes will cause changes to propagate everywhere
* Think internal methods, tests and maybe more

---

# Examples

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

## Configuration Management

- **Dynamic enum creation** from JSON/YAML files
- **Type safety** for configuration keys
- **Runtime flexibility** with compile-time validation

---

# Thank you

<div style="display: flex; align-items: center; justify-content: center;">

<div style="text-align: center; margin-right: 20px; margin-top: 75px;">
<img src="assets/linkedin-qr.png" style="height: 150px; border: 2px solid #0077b5; border-radius: 10px;">
<br><b>LinkedIn:</b> <a href="https://linkedin.com/in/tsvim">linkedin.com/in/tsvim</a>
</div>

<div style="text-align: center; margin-left: 20px; margin-top: 75px;">
<img src="assets/github-qr.png" style="height: 150px; border: 2px solid #333; border-radius: 10px;">
<br><b>GitHub:</b> <a href="https://github.com/tsvi">github.com/tsvi</a>
</div>

</div>

---

# Resources

- Python Enum Documentation: <https://docs.python.org/3/library/enum.html>
- PEP 435 -- Adding an Enum type to the Python standard library: <https://peps.python.org/pep-0435/>
- hdate library: <https://github.com/py-libhdate/py-libhdate>
