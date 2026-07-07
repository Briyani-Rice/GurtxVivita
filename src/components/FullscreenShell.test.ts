import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");

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
    /!isFullscreen &&\s*<Titlebar/,
    "Custom titlebar should be hidden while fullscreen is active",
);

assert.match(
    source,
    /setFullscreen\(!currentlyFullscreen\)/,
    "Fullscreen toggle should update the native Tauri window",
);

console.log("Fullscreen shell source checks passed");
