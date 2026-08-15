import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// firestore.rules is only worth writing if `firebase deploy` can actually ship
// it. Without a firestore section in firebase.json the CLI has nothing to
// deploy and the rules file sits inert while the live database keeps whatever
// rules it already had.
const firebaseConfig = JSON.parse(
    readFileSync(new URL("../../firebase.json", import.meta.url), "utf8"),
) as { firestore?: { rules?: string } };

assert.equal(
    firebaseConfig.firestore?.rules,
    "firestore.rules",
    "firebase.json must point at firestore.rules so the rules can be deployed",
);

const rules = readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8");

// A signed-in user owns their own profile document, so without an explicit
// guard they can write perms: "staff" to it and promote themselves.
const userBlockStart = rules.indexOf("match /user/{uid}");
assert.notEqual(userBlockStart, -1, "firestore.rules must still cover /user/{uid}");

const userBlock = rules.slice(userBlockStart, rules.indexOf("}", rules.indexOf("allow create", userBlockStart)));

assert.doesNotMatch(
    userBlock,
    /allow\s+read\s*,\s*write\s*:/,
    "Reads and writes must be separate so writes can carry a perms guard",
);

assert.match(
    userBlock,
    /perms/i,
    "The user profile write rule must constrain the perms field",
);

// The guard itself must defer to the server-side staff list rather than
// trusting anything the client sent.
const permsGuard = rules.match(/function\s+\w*[Pp]erms\w*\s*\(\s*\)\s*\{[\s\S]*?\n\s*\}/);

assert.ok(permsGuard, "firestore.rules must define a perms guard function");
assert.match(
    permsGuard[0],
    /isAdmin\(\)/,
    "Writing a staff perms value must be gated on the server-side staff list",
);

console.log("firestore rules deploy checks passed");
