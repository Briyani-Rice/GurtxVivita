import assert from "node:assert/strict";
import { withTimeout } from "./withTimeout.ts";

function deferred<T>(): { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void } {
    let resolve!: (v: T) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

// Work that settles before the deadline returns the work's value.
{
    const fast = Promise.resolve("real");
    const result = await withTimeout(fast, 50, () => "fallback");
    assert.equal(result, "real");
}

// Work that never settles must not hang: after the deadline we get the fallback.
{
    const stuck = deferred<string>(); // never resolved — simulates a hung getDoc
    const start = Date.now();
    const result = await withTimeout(stuck.promise, 20, () => "fallback");
    const elapsed = Date.now() - start;
    assert.equal(result, "fallback");
    assert.ok(elapsed >= 15, `expected to wait for the deadline, waited ${elapsed}ms`);
    assert.ok(elapsed < 500, `expected prompt fallback, waited ${elapsed}ms`);
}

// A rejecting work promise still propagates (the caller decides how to handle it),
// and it does so before the deadline rather than waiting it out.
{
    const boom = Promise.reject(new Error("permission-denied"));
    await assert.rejects(
        () => withTimeout(boom, 1000, () => "fallback"),
        /permission-denied/,
    );
}

// Late rejection after a timeout must not crash the process as an unhandled rejection.
{
    const late = deferred<string>();
    const result = await withTimeout(late.promise, 20, () => "fallback");
    assert.equal(result, "fallback");
    late.reject(new Error("arrived too late")); // should be swallowed, not thrown
    await new Promise((r) => setTimeout(r, 10));
}

console.log("withTimeout tests passed");
