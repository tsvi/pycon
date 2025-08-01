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

# Iterating over dates

<div data-marpit-fragment="1">

🎯 Our goal:

```python --no-line-number

HebrewDate(5785, Months.AV, 7) + timedelta(days=35)

```

</div>

<div data-marpit-fragment="2">

📃 Requirements:

- Get the months length
- Get the next month

</div>

---

# Enums are iterable

<div data-marpit-fragment="1">

```python --no-line-number
>>> [x.name for x in Months]
[TISHREI, CHESHVAN, ...]
```

</div>

<div data-marpit-fragment="2">
But how to deal with leap years? 🤔

```python --no-line-number
[..., SHVAT, ADAR, ADAR_I, ADAR_II, NISSAN, ...]
```

</div>

<div data-marpit-fragment="3">
Or next year? 🍏🍯

```python --no-line-number
[..., AV, ELUL]
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

# Usage
print(Months.ELUL.next_month())        # TISHREI
print(Months.SHVAT.next_month(5784))   # ADAR_I
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

# ... which can be dynamic

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

## Or "What happens when your enum values come from a config file? 🤔"

---

# The Intel story: Configuration nightmare 😱

<div data-marpit-fragment="1">

We had YAML configs with product-specific settings:

```yaml
# feature_config.yaml
features:
  - name: "turbo_boost"
    enabled: true
    valid_for: ["SERVER", "CLIENT"]  # Only some products
  
  - name: "power_saving"
    enabled: false
    valid_for: ["MOBILE"]
    
  - name: "debug_mode"
    enabled: true
    # No valid_for = applies to all products
```

</div>

<div data-marpit-fragment="2">

```python
@dataclass
class FeatureConfig:
    name: str
    enabled: bool
    valid_for: List[str] = field(default_factory=list)  # Empty = all products
```

</div>

---

# The problem: Runtime configuration chaos

<div data-marpit-fragment="1">

```python --no-line-number
def apply_feature(feature_config, current_product):
    if feature_config.valid_for:
        if current_product in feature_config.valid_for:
            return enable_feature(feature_config.name)
        return None
    return enable_feature(feature_config.name)  # Valid for all

# But what if YAML contains typos?
# valid_for: ["SEVER", "CLIENT"]  # 😱 Typo! SEVER != SERVER
```

</div>

<div data-marpit-fragment="2">

**Problems:**

- 🐛 YAML typos cause silent failures
- ❓ No validation of product names at config load time  
- 🔧 Features silently ignored for "invalid" products

</div>

---

# Load project configuration from YAML

<div data-marpit-fragment="1">

```python --no-line-number
import yaml
from enum import StrEnum

# Load project configuration
with open("project_config.yaml") as f:
    project_config = yaml.safe_load(f)

project_products = project_config["valid_products"]
# ["SERVER", "CLIENT", "MOBILE"]

ProductEnum = StrEnum("ProductEnum", project_products)
```

</div>

---

# Validate feature configs against enum

<div data-marpit-fragment="1">

```python --no-line-number
@dataclass  
class FeatureConfig:
    name: str
    enabled: bool
    valid_for: List[ProductEnum] = field(default_factory=list)
    
    def __post_init__(self):
        # Convert strings to enum members, validate automatically!
        self.valid_for = [ProductEnum(p) for p in self.valid_for]
        # Raises ValueError if invalid product name!
```

</div>

---

# ⚠️ The pitfalls of using enums

## Or "How we learned not to do stupid stuff the hard way 🤦‍♂️"

---

# Pitfall #1: Enums are singletons!

<div data-marpit-fragment="1">

```python --no-line-number
class Months(Enum):
    TISHREI = 1
    CHESHVAN = 2
    # ...
    
    def set_language(self, lang):
        self.display_language = lang  # 😱 BAD!

# In one part of code:
Months.TISHREI.set_language("hebrew")

# In another part:
print(Months.TISHREI.display_language)  # Still "hebrew"!
# This affects ALL instances of Months.TISHREI everywhere!
```

</div>

<div data-marpit-fragment="2">

**The problem:** You changed ALL instances of that enum member across your entire application! 🔥

</div>

---

# Pitfall #2: Test pollution

<div data-marpit-fragment="1">

```python --no-line-number
class Status(Enum):
    PENDING = "pending"
    COMPLETE = "complete"
    
    def mark_as_seen(self):
        self._seen = True  # 😱 Modifying enum state

def test_status_workflow():
    Status.PENDING.mark_as_seen()
    assert Status.PENDING._seen == True  # ✅ Pass

def test_fresh_status():
    # This test runs after the first one
    assert not hasattr(Status.PENDING, '_seen')  # ❌ Fail!
    # Status.PENDING still has _seen=True from previous test!
```

</div>

<div data-marpit-fragment="2">

**The lesson:** Tests started failing randomly depending on execution order! 🎲

</div>

---

# Pitfall #3: Complex inheritance gone wrong

<div data-marpit-fragment="1">

```python --no-line-number
class BaseConfig(Enum):
    def validate(self):
        # Complex validation logic here
        pass

class DatabaseConfig(BaseConfig):  # 😱 This gets complicated fast
    MYSQL = "mysql://localhost"
    POSTGRES = "postgres://localhost"
    
    def connect(self):
        # Database connection logic
        # But what if validation fails?
        # How do you handle different DB types?
        # Suddenly your enum is doing too much!
```

</div>

<div data-marpit-fragment="2">

**Better approach:** Keep enums simple, use composition instead of complex inheritance

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
