import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./types.ts", import.meta.url), "utf8");

assert.match(
    source,
    /new User\('User',\s*'User12345',\s*UserPerms\.Staff\)/,
    "Expected User / User12345 to be configured as a staff account"
);

assert.doesNotMatch(
    source,
    /new User\('User',\s*'pass'/,
    "The old User / pass credential should not remain configured"
);

console.log("types tests passed");
