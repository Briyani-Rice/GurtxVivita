import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const accountSource = readFileSync(new URL("./Account.tsx", import.meta.url), "utf8");
const sessionSource = readFileSync(new URL("../../../services/accountSession.ts", import.meta.url), "utf8");
const loginSource = readFileSync(new URL("../../LoginTab.tsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../../../app.tsx", import.meta.url), "utf8");
const firebaseAuthSource = readFileSync(new URL("../../../services/firebaseAuth.ts", import.meta.url), "utf8");

assert.match(accountSource, /name:\s*"Account"/, "Settings should expose an Account page");
assert.match(accountSource, /Current account/, "Account page should show the current account section");
assert.match(accountSource, /Previous accounts/, "Account page should show remembered previous accounts");
assert.match(accountSource, /viventory:open-login/, "Account page should ask App to open Login from Settings");
assert.match(accountSource, /clearCurrentAccount/, "Account page should support logout by clearing the current account");
assert.match(accountSource, /signOutOfFirebase/, "Account page should sign out Firebase-backed sessions on logout");

assert.match(sessionSource, /CURRENT_ACCOUNT_KEY/, "Account session helper should persist the current account");
assert.match(sessionSource, /ACCOUNT_HISTORY_KEY/, "Account session helper should persist account history");
assert.match(sessionSource, /recordAccountLogin/, "Account session helper should record login history");
assert.match(sessionSource, /ACCOUNT_SESSION_EVENT/, "Account session helper should broadcast account changes");
assert.match(sessionSource, /slice\(0,\s*5\)/, "Account history should be capped to a small recent list");

assert.match(loginSource, /recordAccountLogin/, "Login flow should record successful accounts");
assert.match(loginSource, /provider:\s*"demo"/, "Demo login should be recorded as a demo account");
assert.match(loginSource, /provider:\s*"google"/, "Google login should be recorded as a Google account");

assert.match(appSource, /viventory:open-login/, "App should listen for Settings account login requests");
assert.match(appSource, /openLoginTab/, "App should centralize Login tab opening");

assert.match(firebaseAuthSource, /signOutOfFirebase/, "Firebase auth service should expose sign-out for account settings");

console.log("Account settings source checks passed");
