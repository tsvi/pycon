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
<img src="assets/home-assistant.png" alt="Home Assistant">
</div>

<div class="bio-item" data-marpit-fragment="3">
<img src="assets/jewish-calendar.png" alt="Jewish Calendar App">
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

* 📅 The hdate library
* 💻 An internal Intel library (with all the secret sauce taken out 😉)

<div data-marpit-fragment="2">
... in 3 parts
</div>

* How Enums improved our code
* Cool tricks
* 🍕 The late night debugging of our own stupidity

---

# Part I - The story of the hdate library

## Or "Why should I use Enums? 🤔"

---

# This month shall the start of the months

The hdate library started off as a python port of some C-code back in April 2016.

<div data-marpit-fragment="1">

```python --no-line-number
>>> from datetime import date

>>> today = HDate(date.today())
>>> today.get_hebrew_date()
(2, 11, 5785)  # 2nd of Av, 5785
```

</div>

---

# So what month are we in?

<div data-marpit-fragment="1">

Using numbers is not very user friendly to the user

</div>

<div data-marpit-fragment="1">

```python --no-line-number
MONTH_TABLE = {"english": ["Tishrei", "Cheshvan", ...]}

class HDate:

    def __str__(self):
        return hebrew_date_str(day, month, year, language="hebrew")

def hebrew_date_str(day, month, year, language):
    month_str = MONTH_TABLE[language][month]
```

</div>

---

# But what about the programmer?

<div data-marpit-fragment="1">

Guess what the following does?

```python --no-line-number
    if date.month == 13:
        month = 6
    if date.month == 14:
        month = 6
        day += 30
```

</div>

---

# Even better: debugging test code 😈

A snippet from our tests codebase from 6 years ago

```python --no-line-number
@pytest.mark.parametrize(("date", "holiday"), [
    ((21, 7), "pesach_vii"),
    ((6, 9), "shavuot"),
    ((25, 3), "chanukah"),
])
def test_holidays(date, holiday):
    ...
```

<div data-marpit-fragment="2">

Not really friendly when debugging. 😩

</div>

---

# Hey, we should use enums 💡

A month is literally an enumerated type

<div data-marpit-fragment="1">

```python --no-line-number
class Months(Enum):

    TISHREI = auto()
    CHESHVAN = auto()
    KISLEV = auto()
    TEVET = auto()
```

</div>

---

# And we get free goodies 🍺

<div data-marpit-fragment="1">

Validation ...

```python --no-line-number
>>> month = Months(15)
ValueError: 15 is not a valid Months
```

</div>

<div data-marpit-fragment="2">
... and introspection 🎉

```python --no-line-number
>>> [x.name for x in Months]
[TISHREI, CHESHVAN, ...]
```

</div>

---

# Available since Python 3.4 (That's more than 10 years ago 😉)

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

# Adding Attributes to Enums

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

# Creating dynamic attributes

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

# ⚠️ The pitfalls of using enums

---

# Singletons

* These are *NOT* your regular classes
* Changing attributes will cause changes to propagate everywhere
* Think internal methods, tests and maybe more

---

# Complexity

## Hard to extend

* Although using dynamic enums can help

## Comparison issues

* Use `.value` when comparing to `int`/`str`
* OR use `StrEnum` and `IntEnum`
* When using enums in heavily used methods (think `__eq__`), consider using `.value`
  comparisons for a performance boost

---

# Examples

---

# When to Use Enums with attributes

<div data-marpit-fragment="1">

✅ DO use when:

- The behavior is intrinsic to the enum member
- The attributes are well-defined
- You need a closed set of related constants with behavior

</div>

<div data-marpit-fragment="2">

❌ DON'T use when:

- The behavior could change at runtime
- You need mutable state
- The relationship between constants is complex

</div>

---

# When to use dynamic enums

* The information changes every time the code is run
* It does **NOT** need to change during the run

---

<div style="font-style: italic; font-size: 1.2em; color: #5C4D7D;">

> "Simple is better than complex. Complex is better than complicated."
> — The Zen of Python (PEP20)

</div>

<div data-marpit-fragment="1" style="margin-top: 1em;">
Enums should make your code more readable, not less!
</div>

---

# Resources

- Python Enum Documentation: <https://docs.python.org/3/library/enum.html>
- PEP 435 -- Adding an Enum type to the Python standard library: <https://peps.python.org/pep-0435/>
- hdate library: <https://github.com/py-libhdate/py-libhdate>

---

# Thank you

<div style="display: flex; align-items: center; justify-content: center;">

<div style="text-align: center; margin-right: 75px; margin-top: 75px;">
<img src="assets/linkedin-qr.png" alt="LinkedIn QR Code" style="height: 250px;
     border: 2px solid #0077b5; border-radius: 10px;">
<br><b>LinkedIn:</b> <a href="https://linkedin.com/in/tsvim">linkedin.com/in/tsvim</a>
</div>

<div style="text-align: center; margin-left: 75px; margin-top: 75px;">
<img src="assets/github-qr.png" alt="GitHub QR Code" style="height: 250px;
     border: 2px solid #333; border-radius: 10px;">
<br><b>GitHub:</b> <a href="https://github.com/tsvi">github.com/tsvi</a>
</div>

</div>
