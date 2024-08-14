# Designing a plugin architecture in Python

Tsvi Mostovicz | Pycon IL 2024 | Cinema City Glilot, Israel

---

<!-- 2 min - A story describing what a plugin architecture solves -->

## Intro

<!-- TODO: Add images -->

- You write a Python app supporting a variety of options
- A user asks for their specific-use case ...
- Another user asks for their specific-use case ...
- A third user asks for their specific-use case ...
- You realize that slowly your app is becoming a kitchensink

---

<!-- 2 min - Who am I, what I do, a bit about Intel -->

# Bio

---

<!-- 3 min
A general description of our example tool (a code generator) and why it needs a plugin architecture

What it does:
    - Get data from a variety of data sources
    - Apply a Jinja template (Explain 30 seconds on Jinja)

What we need the plugin to do:
    - Using user-defined Jinja filters
    - Support new data sources
-->

# A real life example

---

# What do plugins need - 3 min
Discovery
Manual (provided by configuration)
Automatic
Registration

---

# Supporting user-defined Jinja filters - a simple dynamic import - 3 min
User provides the file to be imported
Registration via a dunder-variable, passed to the Jinja2 environment

---

# Supporting new data-sources - using entry points - 4 min
Automatic discovery of additional file parsers
Optionally providing schemas and dependencies

---

# Improving performance - loading entry points on the fly - 2 min
If time permits - this part can be skipped if we’re overtime
Only load the parser and schema if needed

---

# Recap - 1 min
