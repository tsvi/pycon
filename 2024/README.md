# Designing a plugin architecture in Python

This directory holds the sources to [my talk][recording] presented @ PyconIL 2024.

The presentation was written with the [Marpit][marp] tool.

To generate the final slides, export the presentation to HTML.
After which I exported them to a single HTML file using [Monolith][monolith].

    $ monolith slides.html -o full-slides.html

[monolith]: https://github.com/Y2Z/monolith
[marp]: https://marpit.marp.app/
[recording]: https://youtu.be/Gk3-8IKcj3Q?si=STJlz_T6Q2kWl793

## Abstract

Discover how to enhance your Python apps with plugin architectures using importlib.

## Description

In today's rapidly evolving software landscape, applications often need to be flexible and extensible to meet diverse user requirements. A plugin architecture allows users to enhance the capabilities of your application dynamically. This talk is aimed at developers who want to learn how to design and implement such an architecture in their Python applications.

We will begin by discussing the scenarios where a plugin architecture is beneficial (the why). 
Next, we will dive into the technical details, presenting various strategies for implementing a plugin system (the how). These strategies include:

- Simple dynamic imports for lightweight extensions.
- Using entry points for more structured and discoverable plugins.
- A registration system that allows plugins to declare capabilities and dependencies.
- Improving performance -  loading on the fly

We'll shortly discuss the challenges you might face, such as maintaining code quality, ensuring security, and managing dependencies.

To make these concepts concrete, we'll walk through a real-life example where I integrated a plugin system into a Jinja-based application, enabling users to register custom Jinja filters. This example will demonstrate how to leverage importlib to dynamically load and register user-defined plugins safely and efficiently.

**Target Audience:**

This talk is intended for Python developers of all levels who are interested in enhancing their applications with dynamic, user-defined extensions. Whether you're working on a personal project or a large-scale application in an organizational setting, you'll find valuable insights and practical techniques that you can apply immediately.