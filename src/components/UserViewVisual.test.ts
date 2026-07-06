import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const userViewSource = readFileSync(new URL("UserView.tsx", import.meta.url), "utf8");

assert.match(
    userViewSource,
    /Materials studio/,
    "User materials view should use a warmer makerspace heading",
);

assert.match(
    userViewSource,
    /--viventory-welcome-accent/,
    "User materials view should reuse the warm VIVITA accent tokens",
);

assert.match(
    userViewSource,
    /Available now/,
    "Material cards should make stock status more scannable",
);

assert.match(
    userViewSource,
    /Need it for a project/,
    "Request modal should use friendly project-oriented copy",
);

assert.doesNotMatch(
    userViewSource,
    /background:\s*'#fff'/,
    "User View should not force plain white surfaces",
);

console.log("UserView visual source checks passed");
