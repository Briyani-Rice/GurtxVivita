import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const titlebarSource = readFileSync(new URL("../titlebar.tsx", import.meta.url), "utf8");
const titleStyleSource = readFileSync(new URL("../titlestyle.css", import.meta.url), "utf8");
const commandBarSource = readFileSync(new URL("../CommandBar.tsx", import.meta.url), "utf8");

assert.match(
    titleStyleSource,
    /linear-gradient\(135deg, var\(--viventory-shell-start\)/,
    "Titlebar should use a warm theme-aware gradient",
);

assert.match(
    titlebarSource,
    /className="command-button"/,
    "Titlebar command entry should use the polished command button class",
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

assert.doesNotMatch(
    titleStyleSource,
    /background-color:\s*#3b83a3/,
    "Titlebar should not be locked to the old flat blue",
);

console.log("AppShell visual source checks passed");
