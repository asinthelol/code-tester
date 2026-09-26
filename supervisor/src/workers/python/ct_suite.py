"""
Test registry for Python suites.

Suite files call define_test(name, invoke=..., assert_fn=...)
the keyword is "assert_fn" rather than "assert" since assert
is a reserved word in Python.
"""

_registered = []


def reset_registry():
    global _registered
    _registered = []


def get_registered():
    return _registered


def define_test(name, *, invoke, assert_fn):
    _registered.append({"name": name, "invoke": invoke, "assert_fn": assert_fn})
