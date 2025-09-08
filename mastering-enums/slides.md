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

<div data-marpit-fragment="1">
Two development stories ...
</div>

* 📅 The hdate library (with real examples)
* 💻 An internal Intel library (with all the secret sauce taken out 😉)

<div data-marpit-fragment="2">

about ...

- 🪄 How Enums improved our code (with some cool tricks)
- 🍕 The late night debugging of our own stupidity

</div>

---

# Part I - The story of the hdate library

## Or "Why should I use Enums? 🤔"

---

# This month shall mark for you the beginning of the months (Exodus 12:2)

🟢 The hdate library started off as a Python port of some C-code back in April 2016.

<div data-marpit-fragment="1">

```python --no-line-number
>>> from datetime import date

>>> today = HDate(date(2016, 4, 26))
>>> today.get_hebrew_date()
(10, 1, 5776)
```

</div>

<div data-marpit-fragment="2">

💡 Using numbers is not very user friendly to the user

```python --no-line-number
>>> str(today)
"Monday 10 Nissan 5776"
```

</div>

---

# But what about the programmer?

<div data-marpit-fragment="1">

Guess what the following does?

```python --no-line-number
    if date.month == 13:
        month = 12
    if date.month == 14:
        month = 12
        day += 30
```

</div>

---

# Even better: debugging test code 😈

A snippet from our tests codebase from 6 years ago

```python --no-line-number
@pytest.mark.parametrize(("date", "holiday"), [
    ((21, 1), "pesach_vii"),
    ((6, 3), "shavuot"),
    ((25, 9), "chanukah"),
])
def test_holidays(date, holiday):
    ...
```

Not really friendly when debugging. 😩

---

# Hey, we should use enums 💡

A month is literally an enumerated type

```python --no-line-number
class Months(Enum):

    TISHREI = auto()
    CHESHVAN = auto()
    KISLEV = auto()
    TEVET = auto()
```

---

# Available since Python 3.4 (That's more than 10 years ago 😉)

---

# Incrementing dates

🎯 Our goal:

```python --no-line-number

HebrewDate(5785, Months.AV, 7) + timedelta(days=35)

```

---

# A simplified `__add__` method

```python highlight:6,9
def __add__(self, other: timedelta):
    _year, _month, _day = self.year, self.month, self.day
    days_remaining = other.days
    
    while days_remaining > 0:
        days_left_in_month = get_month_length(_month, _year) - ...

        if days_remaining > days_left_in_month:
            _month = get_next_month(_month, _year)
            ...
    
    return HebrewDate(_year, _month, _day)
```

</div>

---

# Enums are classes (and can have methods)

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
```

---

# ... and even attributes

```python
class Months(Enum):
    TISHREI = 1, 30
    TEVET = 4, 29
    
    def __new__(cls, value, length):
        obj = object.__new__(cls, value)
        obj._value_ = value
        obj._length = length
        return obj

# Usage
print(Months.TISHREI._length)     # 30
print(Months.TEVET.value)         # 4
```

---

# ... which can be dynamic 🏃🏻

```python
class Months(Enum):
    MARCHESHVAN = 2, lambda year: 30 if long_cheshvan(year) else 29
    KISLEV = 3, lambda year: 30 if not short_kislev(year) else 29

    def length(self, year = None):
        """Return the number of days in this month."""
        if callable(self._length):
            return self._length(year)
        return self._length
```

---

# Part II - Creating Enums dynamically

---

# The (simplified) Intel story: A YAML config with product-specific settings

```yaml
- name: "feature_a"
  products: ["process_y"]

- name: "feature_b"
  products: ["process_x"]
  
- name: "debug_mode" # No products -> ALL
```

---

# Problem 🤔

- 📝 Large changes when the manufacturing process changes
- 🐛 Typos in YAML cause silent failures (Non-existent `process_z`)

---

# Solution⚡

<div data-marpit-fragment="1">

Create a project configuration ...

```yaml --no-line-number
products:
  - SERVER: process_x
  - CLIENT: process_y
```

</div>

<div data-marpit-fragment="2">

... mapped at runtime to an Enum:

```python --no-line-number
with open("config.yaml") as f:
    project_config = yaml.safe_load(f)

mapping = project_config["products"]
ProcessConfig = StrEnum("ProcessConfig", mapping)
```

</div>

---

# A more streamlined approach

<div data-marpit-fragment="1">
⭐ Automatic validation of process names
</div>

<div data-marpit-fragment="2">
⭐ No need to change YAML configuration in multiple locations
</div>
</br>
<div data-marpit-fragment="3">

```python --no-line-number --title:"🤩 Bonus: type-safety throughout our code"

@dataclass
class Features:

    processes: list[ProcessConfig]
```

</div>

---

# ⚠️ The pitfalls of using enums

## Or "How we learned not to do stupid stuff the hard way 🤦‍♂️"

---

# Example #1: Setting the language

<div data-marpit-fragment="1">

```python --no-line-number
>>> today = HebrewDate(5785, Months.ELUL, 7)
>>> today.set_language("he")
>>> str(today)
'ז אלול תשפ"ה'
```

</div>

<div data-marpit-fragment="2">

```python --no-line-number
>>> tomorrow = HebrewDate(5785, Months.ELUL, 8)
>>> assert tomorrow - today == timdelta(days=1)
True
```

</div>
<div data-marpit-fragment="3">

```python --no-line-number
>>> str(today)
'תשפ"ה Elul ח'  # WAIT... Why did the month change to English??
```

</div>

<div data-marpit-fragment="4" class="oops-overlay">
OOPS!
</div>

---

# Enums are singletons 🙀

The language attribute of `Months` has been reset when `tomorrow` was created.

---

# Example #2: Test pollution

<div data-marpit-fragment="1">

Sometimes we want "different" Adar's to be considered the same.

```python --no-line-number
def test_set_comparison_mode():
    Months.ADAR.set_comparison_mode(ComparisonMode.ADAR_IS_ADAR_I)
    assert Months.ADAR == Months.ADAR_I
```

</div>
<div data-marpit-fragment="2">

```python --no-line-number
def test_compare():
    assert HebrewDate(5785, Months.ADAR_I, 4) \ 
        != HebrewDate(5785, Months.ADAR, 4)
```

</div>

---

# When to Use Enum attributes

<div class="column-layout">

<div> <!-- Left column -->
<h3 class="do-heading">✅ DO use attributes:</h3>

- Behavior belongs to enum member
- Data is constant and well-defined

Examples:

- Pre-defined values (length, position)

</div>

<div> <!-- Right column -->
<h3 class="dont-heading">❌ DON'T use attributes:</h3>

- Attribute state will be modified during runtime
- Behavior dependent on context

Examples:

- Storing preferences
- Tracking state

</div>
</div>

---

# When to Use Dynamic Enums

<div class="column-layout">

<div> <!-- Left column -->
<h3 class="do-heading">✅ Perfect for:</h3>

- Config that varies between runs
- External data sources

Examples:

- Product SKUs from files
- API endpoints (dev/staging/prod)

</div>

<div> <!-- Right column -->
<h3 class="dont-heading">❌ Not suitable for:</h3>

- Values changing during execution

Examples:

- Runtime feature toggles that can be switched

</div>
</div>

---

<div style="font-style: italic; font-size: 1.2em; color: #5C4D7D;">

> "Simple is better than complex. Complex is better than complicated."
> — The Zen of Python (PEP20)

</div>

<div style="margin-top: 1em;">
Enums should make your code more readable, not less!
</div>

---

# Resources

- Python Enum Documentation: <https://docs.python.org/3/library/enum.html>
- PEP 435 -- Adding an Enum type to the Python standard library: <https://peps.python.org/pep-0435/>
- hdate library: <https://github.com/py-libhdate/py-libhdate>

---

# Thank you

<div class="column-layout">

<div style="text-align: center; margin-right: 25px; margin-top: 50px;">
<img src="assets/linkedin-qr.png" alt="LinkedIn QR Code" style="height: 250px;
     border: 2px solid #0077b5; border-radius: 10px;">
<br><b>LinkedIn:</b> <a href="https://linkedin.com/in/tsvim">linkedin.com/in/tsvim</a>
</div>

<div style="text-align: center; margin-left: 25px; margin-top: 50px;">
<img src="assets/github-qr.png" alt="GitHub QR Code" style="height: 250px;
     border: 2px solid #333; border-radius: 10px;">
<br><b>GitHub:</b> <a href="https://github.com/tsvi">github.com/tsvi</a>
</div>

</div>
