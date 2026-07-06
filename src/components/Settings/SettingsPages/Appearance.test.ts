import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./Appearance.tsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../../../app.tsx", import.meta.url), "utf8");

assert.match(
    source,
    /appearancePreferences/,
    "Appearance page should use the shared appearance preference module",
);

assert.match(
    source,
    /saveAppearancePrefs/,
    "Appearance controls should persist preference changes",
);

assert.match(
    source,
    /applyAppearancePrefs/,
    "Appearance controls should apply preference changes immediately",
);

assert.match(
    appSource,
    /loadAppearancePrefs/,
    "App startup should load saved appearance preferences",
);

assert.match(
    appSource,
    /applyAppearancePrefs/,
    "App startup should apply saved appearance preferences",
);

console.log("Appearance preference source checks passed");
