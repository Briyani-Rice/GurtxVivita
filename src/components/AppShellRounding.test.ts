import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const tauriConfig = readFileSync(new URL("../../src-tauri/tauri.conf.json", import.meta.url), "utf8");

assert.match(
    appSource,
    /className="app-shell"/,
    "The root app surface should use the app-shell class for native window clipping",
);

assert.match(
    styleSource,
    /--app-window-radius:\s*12px;/,
    "The app window radius should use the requested Mac-style 12px rounding",
);

assert.match(
    styleSource,
    /\.app-shell\s*\{[\s\S]*border-radius:\s*var\(--app-window-radius\);[\s\S]*overflow:\s*hidden;/,
    "The root app surface should clip content to the 12px window radius",
);

assert.match(
    tauriConfig,
    /"transparent":\s*true/,
    "The Tauri window should be transparent so CSS rounded corners show at the native window edge",
);

console.log("App shell rounding checks passed");
