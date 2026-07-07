import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const commandBarSource = readFileSync(new URL("../CommandBar.tsx", import.meta.url), "utf8");

assert.doesNotMatch(
    appSource,
    /<Titlebar/,
    "App shell should not render the custom title bar",
);

assert.doesNotMatch(
    appSource,
    /import Titlebar/,
    "App shell should not import the custom title bar",
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
    commandBarSource,
    /window\.innerWidth/,
    "Command palette should position itself without depending on the title bar",
);

console.log("AppShell visual source checks passed");
