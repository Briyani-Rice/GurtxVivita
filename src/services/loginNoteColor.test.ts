import assert from "node:assert/strict";
import { isProgressNote } from "./googleAuthErrors.ts";

// A redirect under way is progress: LoginTab should render it green, not red.
assert.equal(isProgressNote({ success: false, redirecting: true }), true);
// A real failure is not progress.
assert.equal(isProgressNote({ success: false }), false);
// Success is not a "progress" note (it takes the success path).
assert.equal(isProgressNote({ success: true }), false);

console.log("loginNoteColor tests passed");
