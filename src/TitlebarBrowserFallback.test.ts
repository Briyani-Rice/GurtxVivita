import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./titlebar.tsx", import.meta.url), "utf8");

assert.match(
    source,
    /async function getTitlebarPlatform\(\)/,
    "Titlebar should route platform detection through a browser-safe helper",
);

assert.match(
    source,
    /catch \(error\)/,
    "Titlebar platform detection should catch missing Tauri runtime errors",
);

assert.match(
    source,
    /return "browser"/,
    "Titlebar should fall back to a browser platform when Tauri APIs are unavailable",
);

assert.match(
    source,
    /let cancelled = false/,
    "Titlebar should avoid setting state after unmount while platform detection is pending",
);

console.log("Titlebar browser fallback source checks passed");
