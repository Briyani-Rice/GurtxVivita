import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const settingsSource = readFileSync(new URL("./Settings.tsx", import.meta.url), "utf8");
const appearanceSource = readFileSync(new URL("./SettingsPages/Appearance.tsx", import.meta.url), "utf8");

assert.match(
    settingsSource,
    /Control room/,
    "Settings shell should use a warmer control-room heading",
);

assert.match(
    settingsSource,
    /--viventory-welcome-bg/,
    "Settings shell should use the shared warm background tokens",
);

assert.match(
    appearanceSource,
    /Make the app feel right for the workshop/,
    "Appearance page should use friendlier workshop-oriented copy",
);

assert.match(
    appearanceSource,
    /Preview card/,
    "Appearance page should show a small visual preview",
);

assert.doesNotMatch(
    settingsSource,
    /border:\s*index === selectedIndex\s*\?\s*"2px solid black"/,
    "Settings selected page should not use a hard black border",
);

console.log("Settings visual source checks passed");
