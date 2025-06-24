# Beyond constants: Mastering Python enums

This directory holds the sources to my talk to be presented @ PyconIL 2025.

## Abstract

Explore advanced enum usage in Python: define methods, attach metadata, and create enums dynamically. Learn the benefits and pitfalls of the enum singleton to write more expressive and maintainable code.

## Description

While working on the open-source hdate library (which I maintain) and on internal tools at Intel, I came across some lesser-known but powerful uses of Python enums.
From attaching extra data and methods to make code more expressive, to dynamically generating enums from configuration files, these patterns can add clarity to your code if used with care.
In this talk, I’ll share these techniques, their advantages, and the subtle pitfalls to watch out for when using a singleton data structure.

## Notes

Enums in Python are commonly used as simple constants to make code more readable. In some cases, it can be very beneficial to add some extra data and methods to an enum to make the code more expressive. Obviously, one should take care as the enum is a singleton. A fact that's easily overlooked, especially when testing, where suddenly your enum behaves differently from test to test.
Enums are also known to be defined at the get-go with no possibility to modify them. So, how can you dynamically populate an enum? Especially, if you want to type hint your dataclass, which uses it?