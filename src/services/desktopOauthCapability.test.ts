import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// tauri-plugin-oauth ships no `default` permission set — only allow-start,
// allow-cancel, deny-start and deny-cancel (verify with `npx tauri permission
// ls oauth`). Asking for "oauth:default" resolves to nothing, so the loopback
// server is denied by the ACL and start() rejects with a bare string, which the
// UI surfaces as the generic "Google login failed.".
const capabilities = JSON.parse(
    readFileSync(new URL("../../src-tauri/capabilities/default.json", import.meta.url), "utf8"),
) as { permissions: unknown[] };

const granted = capabilities.permissions.filter(
    (permission): permission is string => typeof permission === "string",
);

assert.ok(
    granted.includes("oauth:allow-start"),
    "Desktop Google login needs oauth:allow-start to open the loopback server",
);

assert.ok(
    granted.includes("oauth:allow-cancel"),
    "Desktop Google login needs oauth:allow-cancel to close the loopback server",
);

assert.ok(
    !granted.includes("oauth:default"),
    "oauth:default does not exist in tauri-plugin-oauth and silently grants nothing",
);

console.log("desktop oauth capability checks passed");
