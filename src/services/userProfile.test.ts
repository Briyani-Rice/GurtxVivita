import assert from "node:assert/strict";
import { buildUserProfile } from "./userProfile.ts";
import { UserPerms } from "../types.ts";

// A fallback of Staff (email is on the admin list) always wins.
const adminProfile = buildUserProfile(
    { uid: "u1", email: "a@b.com", displayName: "Ada" },
    { perms: "basic" },
    UserPerms.Staff,
);
assert.equal(adminProfile.perms, UserPerms.Staff);
assert.equal(adminProfile.username, "Ada");

// The stored perms field must NEVER grant staff. A signed-in user owns their
// own user/{uid} document, so trusting it let anyone write perms: "staff" once
// and come back as an admin. Staff comes from the email allowlist only.
const plantedStaff = buildUserProfile(
    { uid: "u2", email: "c@d.com", displayName: null },
    { username: "StoredName", perms: "staff" },
    UserPerms.Basic,
);
assert.equal(plantedStaff.perms, UserPerms.Basic);

// Non-privileged stored fields are still honoured.
assert.equal(plantedStaff.username, "StoredName");

// Username falls back email -> "Google user" when nothing else is present.
const noName = buildUserProfile(
    { uid: "u3", email: null, displayName: null },
    {},
    UserPerms.Basic,
);
assert.equal(noName.username, "Google user");

console.log("userProfile tests passed");
