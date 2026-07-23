import assert from "node:assert/strict";
import { resolveDisplayMode } from "./displayMode.ts";

assert.equal(resolveDisplayMode("?display=tv"), "tv");
assert.equal(resolveDisplayMode("?display=kiosk"), "kiosk");
assert.equal(resolveDisplayMode("?display=normal"), "normal");
assert.equal(resolveDisplayMode(""), "normal", "empty search is normal");
assert.equal(resolveDisplayMode("?foo=bar"), "normal", "missing param is normal");
assert.equal(resolveDisplayMode("?display=banana"), "normal", "unknown value is normal");
assert.equal(resolveDisplayMode("?display=TV"), "tv", "value is case-insensitive");
