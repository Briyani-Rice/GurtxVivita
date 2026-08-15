import assert from "node:assert/strict";
import { greetingName } from "./greetingName.ts";
import type { AccountRecord } from "./accountSession.ts";

function account(label: string): AccountRecord {
    return {
        id: "google:test",
        label,
        provider: "google",
        lastLoginAt: "2026-08-15T00:00:00.000Z",
    };
}

// Only the first word is greeted. This reads as friendlier, and is knowingly
// wrong for names written family-name-first ("Le Son Tung" -> "Le").
assert.equal(greetingName(account("Le Son Tung")), "Le");
assert.equal(greetingName(account("Jane Smith")), "Jane");
assert.equal(greetingName(account("Jane")), "Jane");
assert.equal(greetingName(account("  Jane  Smith ")), "Jane");

// app.tsx sets label to `displayName || email || "Google account"`, so these
// two are not names — greeting them would render "Hi, someone@example.com!".
assert.equal(greetingName(account("le_son_tung@example.com")), null);
assert.equal(greetingName(account("Google account")), null);
assert.equal(greetingName(account("  google ACCOUNT  ")), null);

// Nothing usable to greet.
assert.equal(greetingName(account("")), null);
assert.equal(greetingName(account("   ")), null);
assert.equal(greetingName(null), null);

console.log("greetingName tests passed");
