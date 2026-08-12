import assert from "node:assert/strict";
import { errorDetail, googleAuthErrorMessage } from "./googleAuthErrors.ts";

assert.match(googleAuthErrorMessage("auth/configuration-not-found", "x"), /Enable Firebase Authentication/);
assert.match(googleAuthErrorMessage("auth/operation-not-allowed", "x"), /Google provider/);
assert.match(googleAuthErrorMessage("auth/unauthorized-domain", "x"), /Authorized domains/);
assert.match(googleAuthErrorMessage("auth/popup-closed-by-user", "x"), /closed/i);
assert.match(googleAuthErrorMessage("auth/cancelled-popup-request", "x"), /again/i);
assert.match(googleAuthErrorMessage("auth/network-request-failed", "x"), /network/i);

// Unknown code falls back to "code: fallback".
assert.equal(googleAuthErrorMessage("auth/weird", "boom"), "auth/weird: boom");
// No code returns the bare fallback.
assert.equal(googleAuthErrorMessage(undefined, "boom"), "boom");

console.log("googleAuthErrors tests passed");

// Tauri plugin invocations reject with plain strings, not Error instances.
// Discarding them hid an ACL denial behind the generic "Google login failed.".
assert.equal(
    errorDetail("oauth.start not allowed. Permissions: oauth:allow-start", "Google login failed."),
    "oauth.start not allowed. Permissions: oauth:allow-start",
);
assert.equal(errorDetail(new Error("boom"), "fallback"), "boom");
assert.equal(errorDetail({ message: "object detail" }, "fallback"), "object detail");
assert.equal(errorDetail(null, "fallback"), "fallback");
assert.equal(errorDetail("   ", "fallback"), "fallback");

console.log("googleAuthErrors checks passed");
