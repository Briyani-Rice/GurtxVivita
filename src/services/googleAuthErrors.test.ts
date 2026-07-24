import assert from "node:assert/strict";
import { googleAuthErrorMessage } from "./googleAuthErrors.ts";

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
