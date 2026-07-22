import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const settingsSource = readFileSync(new URL("./Settings.tsx", import.meta.url), "utf8");
const appearanceSource = readFileSync(new URL("./SettingsPages/Appearance.tsx", import.meta.url), "utf8");

assert.match(
    settingsSource,
    /t\("settings\.controlRoom"\)/,
    "Settings shell should use a warmer control-room heading",
);

assert.match(
    readFileSync(new URL("../../i18n/i18n.ts", import.meta.url), "utf8"),
    /"settings\.controlRoom": "Control room"/,
    "Control room heading should have English copy in the i18n dictionary",
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
