import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const tabSystemDocs = readFileSync(new URL("./Docs/Resources/MDFiles/TabSystem.md", import.meta.url), "utf8");

assert.match(
    appSource,
    /SearchCommand\.receive/,
    "Search command should receive app tab controls",
);

assert.match(
    appSource,
    /new welcomeTab\(\)/,
    "Search command should be able to open or focus the Welcome tab",
);

assert.match(
    appSource,
    /event\.metaKey && event\.key\.toLowerCase\(\) === 't'/,
    "Cmd+T should create a new tab",
);

assert.match(
    appSource,
    /event\.metaKey && event\.key\.toLowerCase\(\) === 'w'/,
    "Cmd+W should close the current tab",
);

assert.match(
    tabSystemDocs,
    /\|\s*Shortcut\s*\|\s*Action\s*\|/,
    "Tab system shortcuts should be documented in an aligned table",
);

assert.match(
    tabSystemDocs,
    /\|\s*`⌘T`\s*\|\s*New tab\s*\|/,
    "Docs should show Cmd+T as the new tab shortcut",
);

assert.match(
    tabSystemDocs,
    /\|\s*`⌘W`\s*\|\s*Close current tab\s*\|/,
    "Docs should show Cmd+W as the close tab shortcut",
);

console.log("Command shortcut behavior source checks passed");
