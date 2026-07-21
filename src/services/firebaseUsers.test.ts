import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const usersSource = readFileSync(new URL("./firebaseUsers.ts", import.meta.url), "utf8");
const authSource = readFileSync(new URL("./firebaseAuth.ts", import.meta.url), "utf8");

assert.match(usersSource, /USER_COLLECTION\s*=\s*"user"/);
assert.match(usersSource, /getFirebaseFirestore/);
assert.match(usersSource, /getDoc/);
assert.match(usersSource, /setDoc/);
assert.match(usersSource, /perms/);
assert.match(usersSource, /username/);
assert.match(usersSource, /email/);
assert.doesNotMatch(
    usersSource,
    /password/,
    "Firebase user profiles should not store passwords",
);

assert.match(
    authSource,
    /getOrCreateFirebaseUserProfile/,
    "Google login should read Firebase user permissions",
);
assert.match(
    authSource,
    /profile\.perms/,
    "Google login should use Firestore user perms for admin access",
);

console.log("Firebase users source checks passed");
