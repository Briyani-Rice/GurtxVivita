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
    appSource,
    /event\.ctrlKey && event\.key === 'Tab'/,
    "Ctrl+Tab should switch between open tabs",
);

assert.match(
    appSource,
    /event\.shiftKey \? -1 : 1/,
    "Ctrl+Shift+Tab should switch to the previous open tab",
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

assert.match(
    tabSystemDocs,
    /\|\s*`Ctrl\+Tab`\s*\|\s*Next tab\s*\|/,
    "Docs should show Ctrl+Tab as the next tab shortcut",
);

assert.match(
    tabSystemDocs,
    /\|\s*`Ctrl\+Shift\+Tab`\s*\|\s*Previous tab\s*\|/,
    "Docs should show Ctrl+Shift+Tab as the previous tab shortcut",
);

assert.match(
    appSource,
    /\/\^\[1-9\]\$\/\.test\(event\.key\)/,
    "Cmd+1 through Cmd+9 should jump directly to a tab",
);

assert.match(
    appSource,
    /digit === 9 \? tabs\.length - 1 : digit - 1/,
    "Cmd+9 should jump to the last tab like browsers do",
);

assert.match(
    appSource,
    /event\.code === 'BracketRight' \|\| event\.code === 'BracketLeft'/,
    "Cmd+Shift+bracket should cycle between tabs",
);

assert.match(
    tabSystemDocs,
    /\|\s*`⌘1`–`⌘8`\s*\|\s*Jump to tab 1–8\s*\|/,
    "Docs should show Cmd+number tab jumping",
);

assert.match(
    tabSystemDocs,
    /\|\s*`⌘9`\s*\|\s*Jump to last tab\s*\|/,
    "Docs should show Cmd+9 as jump to last tab",
);

assert.match(
    tabSystemDocs,
    /\|\s*`⌘Y`\s*\|\s*Open command bar\s*\|/,
    "Docs should show Cmd+Y as the command bar shortcut",
);

console.log("Command shortcut behavior source checks passed");
