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
    /&gt; Enter command/,
    "Always-visible command entry should show the command prompt label",
);

assert.doesNotMatch(
    titlebarSource,
    /className="command-button"/,
    "Titlebar should not own the only command entry",
);

console.log("CommandEntryVisibility.test.ts passed");
