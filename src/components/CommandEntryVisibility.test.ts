import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const titlebarSource = readFileSync(new URL("../titlebar.tsx", import.meta.url), "utf8");

assert.match(
    appSource,
    /function AppCommandEntry/,
    "App should render the command entry from the always-visible app shell",
);

assert.match(
    appSource,
    /<AppCommandEntry setCmdBarVis=\{setCmdBarVis\} \/>/,
    "Command entry should remain visible even when the custom titlebar is hidden in fullscreen",
);

assert.match(
    appSource,
    /&gt; \{t\("app\.enterCommand"\)\}/,
    "Always-visible command entry should show the command prompt label",
);

assert.match(
    readFileSync(new URL("../i18n/i18n.ts", import.meta.url), "utf8"),
    /"app\.enterCommand": "Enter command"/,
    "Command prompt label should have English copy in the i18n dictionary",
);

assert.doesNotMatch(
    titlebarSource,
    /className="command-button"/,
    "Titlebar should not own the only command entry",
);

console.log("CommandEntryVisibility.test.ts passed");
