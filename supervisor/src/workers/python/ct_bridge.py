"""Entry point Node's run.ts spawns for adapter: "python".

Discovers and runs a suite file's define_test(...) calls, printing one
JSON line per event to stdout for the Node side to translate into
protocol events (see supervisor/src/workers/python/run.ts).
"""

import asyncio
import builtins
import importlib.util
import inspect
import json
import sys
import time
import uuid

import ct_context
import ct_suite



_REAL_STDOUT = sys.stdout


def _emit(event):
    _REAL_STDOUT.write(json.dumps(event) + "\n")
    _REAL_STDOUT.flush()


# A single loop reused across every test's invoke/assert_fn
_loop = asyncio.new_event_loop()


def _maybe_await(value):
    if inspect.isawaitable(value):
        return _loop.run_until_complete(value)
    return value


class _CapturingWriter:
    """
    Redirects sys.stdout/sys.stderr during a test's invoke/assert_fn so
    print()/errors show up as test.stdout/test.stderr events.
    """

    def __init__(self, emit_chunk):
        self._emit_chunk = emit_chunk

    def write(self, chunk):
        if chunk:
            self._emit_chunk(chunk)

    def flush(self):
        pass


def _run_captured(test_id, fn):
    original_stdout, original_stderr = sys.stdout, sys.stderr
    sys.stdout = _CapturingWriter(
        lambda chunk: _emit({"event": "stdout", "testId": test_id, "chunk": chunk})
    )
    sys.stderr = _CapturingWriter(
        lambda chunk: _emit({"event": "stderr", "testId": test_id, "chunk": chunk})
    )
    try:
        fn()
    finally:
        sys.stdout, sys.stderr = original_stdout, original_stderr


def main():
    if len(sys.argv) < 3:
        sys.stderr.write("Usage: ct_bridge.py <entryPoint> <suiteRoot>\n")
        sys.exit(1)

    entry_point, suite_root = sys.argv[1], sys.argv[2]
    sys.path.insert(0, suite_root)

    ct_suite.reset_registry()
    builtins.define_test = ct_suite.define_test

    ctx = ct_context.connect_context()

    try:
        spec = importlib.util.spec_from_file_location("ct_target_suite", entry_point)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
    except Exception as error:  # noqa: BLE001
        _emit({"event": "run_failed", "reason": str(error)})
        return

    tests = ct_suite.get_registered()
    discovered = [{"id": str(uuid.uuid4()), "name": test["name"]} for test in tests]
    _emit({"event": "discovered", "tests": discovered})

    for test, meta in zip(tests, discovered):
        test_id = meta["id"]
        _emit({"event": "test_started", "testId": test_id})

        start = time.monotonic()
        outcome = {"status": "passed", "error": None}

        def do_invoke_and_assert():
            try:
                result = _maybe_await(test["invoke"](ctx))
            except Exception as invoke_error:  # noqa: BLE001
                outcome["status"] = "errored"
                outcome["error"] = str(invoke_error)
                return

            try:
                _maybe_await(test["assert_fn"](result, ctx))
            except Exception as assert_error:  # noqa: BLE001
                outcome["status"] = "failed"
                outcome["error"] = str(assert_error)

        _run_captured(test_id, do_invoke_and_assert)

        finished_event = {
            "event": "test_finished",
            "testId": test_id,
            "status": outcome["status"],
            "durationMs": int((time.monotonic() - start) * 1000),
        }
        if outcome["error"]:
            finished_event["error"] = outcome["error"]
        _emit(finished_event)


if __name__ == "__main__":
    main()
