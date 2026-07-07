import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const titlebarSource = readFileSync(new URL("../titlebar.tsx", import.meta.url), "utf8");
const capabilitySource = readFileSync(new URL("../../src-tauri/capabilities/default.json", import.meta.url), "utf8");

assert.match(
    source,
    /getCurrentWindow/,
    "App should use Tauri window APIs for fullscreen mode",
);

assert.match(
    source,
    /isFullscreen/,
    "App should track fullscreen state in React",
);

assert.match(
    source,
    /event\.key === 'F11'/,
    "F11 should toggle fullscreen mode",
);

assert.match(
    source,
    /event\.metaKey && event\.ctrlKey && event\.key\.toLowerCase\(\) === 'f'/,
    "Ctrl+Cmd+F should toggle fullscreen mode on macOS",
);

assert.match(
    source,
    /!isFullscreen &&\s*<Titlebar/,
    "Custom titlebar should be hidden while fullscreen is active",
);

assert.match(
    source,
    /!isFullscreen &&\s*<Titlebar[\s\S]*<AppCommandEntry setCmdBarVis=\{setCmdBarVis\} \/>/,
    "Command entry should remain visible after the fullscreen-hidden titlebar",
);

assert.match(
    source,
    /setFullscreen\(!currentlyFullscreen\)/,
    "Fullscreen toggle should update the native Tauri window",
);

assert.match(
    titlebarSource,
    /onToggleFullscreen/,
    "Titlebar should expose a clickable fullscreen control",
);

assert.match(
    capabilitySource,
    /core:window:allow-set-fullscreen/,
    "Tauri capability should permit setting native fullscreen",
);

assert.match(
    capabilitySource,
    /core:window:allow-is-fullscreen/,
    "Tauri capability should permit reading native fullscreen state",
);

console.log("Fullscreen shell source checks passed");
