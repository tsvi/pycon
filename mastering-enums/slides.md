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

# Pitfall #1: Changing an Enums attribute affects ALL instances of that Enum's attribute!

---

# Example #1: setting the language

```python
@dataclass
class HebrewDate:

    _language: str = "en"

    def __post_init__(self, ...):
        self.month.set_language(self._language)

today = HebrewDate(5785, Months.ELUL, 7)
today.set_language("he") # -> ז אלול תשפ"ה

# Forgot to set the language? Tomorrow's month is also in Hebrew
tomorrow = HebrewDate(5785, Months.ELUL, 8)
```

---

# Example #2: Test pollution

```python --no-line-number
class ComparisonMode(Enum):

    STRICT = auto()
    ADAR_IS_ADAR_I = auto()
    ADAR_IS_ADAR_II = auto()
    ADAR_IS_ANY = auto()
    
class Months(Enum):

    def set_comparison_mode(self):
        ...
```

---

# Tests randomly fail (dependant on execution order)

<div data-marpit-fragment="1">

```python --no-line-number

def test_set_comparison_mode():
    Month.ADAR_I.set_comparison_mode(ComparisonMode.ADAR_IS_ADAR_I)
    ...
```

</div>
<div data-marpit-fragment="1">

```python --no-line-number
def test_compare():
    assert HebrewDate(5785, Months.ADAR_I, 4) \ 
        != HebrewDate(5785, Months.ADAR, 4)
```

</div>

---

# Pitfall #2: Complex inheritance gone wrong

```python --no-line-number
class BaseConfig(Enum):

    def validate(self):
        # Validation logic here - makes sense
        pass

class ProductConfig(BaseConfig):  # 😱 This gets complicated fast

    # Be careful‼️
    # If you need a singleton maybe you ought to create it explicitly

    def update_state(self):
        pass
```

<div data-marpit-fragment="2">

**Better approach:** Keep enums simple, use _composition_ instead of complex inheritance

</div>

---

# When to Use Enhanced Enums ✅

<div data-marpit-fragment="1">

**DO use enums with methods/attributes when:**

- The behavior belongs to the enum member (like `month.days()`)
- The data is constant and well-defined (like month lengths)  
- You need a closed set of related constants with behavior

```python --no-line-number
class HttpStatus(Enum):
    OK = 200
    NOT_FOUND = 404
    
    def is_success(self):
        return 200 <= self.value < 300  # ✅ Behavior belongs to status
```

</div>

---

# When NOT to Use Enhanced Enums ❌

<div data-marpit-fragment="1">

**DON'T use enums when:**

- You need to modify state during runtime (use regular classes)
- The behavior depends on external context (pass context as parameters)
- You have complex inheritance needs (composition > inheritance)

```python --no-line-number
class UserStatus(Enum):
    ACTIVE = "active"
    
    def set_last_login(self, timestamp):  # 😱 BAD! 
        self.last_login = timestamp  # Modifies singleton state
```

</div>

---

# When to Use Dynamic Enums ✅

<div data-marpit-fragment="1">

**Perfect for:**

- Configuration that changes between deployments/projects
- API endpoints that vary by environment  
- Product SKUs that differ by region
- Feature flags loaded from external systems

```python --no-line-number
# Environment-specific API endpoints
api_config = {"DEV": "dev.api.com", "PROD": "api.com"}
ApiEndpoints = StrEnum("ApiEndpoints", api_config)  # ✅ Good!
```

</div>

---

# When NOT to Use Dynamic Enums ❌

<div data-marpit-fragment="1">

**Not suitable for:**

- Values that change during program execution
- Data that needs complex validation logic
- Highly nested or structured configuration

```python --no-line-number
# User preferences that change during runtime
user_prefs = {"theme": "dark", "language": "en"}
UserPrefs = StrEnum("UserPrefs", user_prefs)  # 😱 BAD!
# What happens when user changes theme to "light"?
```

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
