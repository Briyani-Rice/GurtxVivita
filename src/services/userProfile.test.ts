import assert from "node:assert/strict";
import { buildUserProfile, permsFromValue } from "./userProfile.ts";
import { UserPerms } from "../types.ts";

// permsFromValue maps known staff markers to Staff, everything else to Basic.
assert.equal(permsFromValue("staff"), UserPerms.Staff);
assert.equal(permsFromValue("admin"), UserPerms.Staff);
assert.equal(permsFromValue(UserPerms.Staff), UserPerms.Staff);
assert.equal(permsFromValue("basic"), UserPerms.Basic);
assert.equal(permsFromValue(undefined), UserPerms.Basic);

// A fallback of Staff (email is on the admin list) always wins.
const adminProfile = buildUserProfile(
    { uid: "u1", email: "a@b.com", displayName: "Ada" },
    { perms: "basic" },
    UserPerms.Staff,
);
assert.equal(adminProfile.perms, UserPerms.Staff);
assert.equal(adminProfile.username, "Ada");

// A non-admin fallback keeps whatever perms the stored doc had.
const returningStaff = buildUserProfile(
    { uid: "u2", email: "c@d.com", displayName: null },
    { username: "StoredName", perms: "staff" },
    UserPerms.Basic,
);
assert.equal(returningStaff.perms, UserPerms.Staff);
assert.equal(returningStaff.username, "StoredName");

// Username falls back email -> "Google user" when nothing else is present.
const noName = buildUserProfile(
    { uid: "u3", email: null, displayName: null },
    {},
    UserPerms.Basic,
);
assert.equal(noName.username, "Google user");

console.log("userProfile tests passed");
