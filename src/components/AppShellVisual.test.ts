import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const titlebarSource = readFileSync(new URL("../titlebar.tsx", import.meta.url), "utf8");
const titleStyleSource = readFileSync(new URL("../titlestyle.css", import.meta.url), "utf8");
const commandBarSource = readFileSync(new URL("../CommandBar.tsx", import.meta.url), "utf8");
const tauriConfigSource = readFileSync(new URL("../../src-tauri/tauri.conf.json", import.meta.url), "utf8");

assert.match(
    appSource,
    /<Titlebar/,
    "App shell should keep the custom command/title strip",
);

assert.match(
    appSource,
    /import Titlebar/,
    "App shell should import the custom command/title strip",
);

assert.match(
    titleStyleSource,
    /linear-gradient\(135deg, var\(--viventory-shell-start\)/,
    "Custom command strip should keep the warm theme-aware gradient",
);

assert.match(
    appSource,
    /className="command-button"/,
    "App shell command entry should use the polished command button class",
);

assert.doesNotMatch(
    titlebarSource,
    /className="command-button"/,
    "Titlebar should not own the command entry hidden by fullscreen",
);

assert.match(
    appSource,
    /--viventory-tab-active-border/,
    "Tabs should use theme-aware active borders",
);

assert.match(
    commandBarSource,
    /backdropFilter:\s*"blur\(18px\)"/,
    "Command palette should use a layered blurred surface",
);

assert.match(
    tauriConfigSource,
    /"decorations":\s*true/,
    "Tauri desktop window should show the native macOS traffic lights",
);

console.log("AppShell visual source checks passed");
