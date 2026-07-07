import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const styleCss = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const appearancePrefs = readFileSync(
    new URL("./Settings/appearancePreferences.ts", import.meta.url),
    "utf8",
);

const vivitaSiteColors = [
    "#24262B",
    "#A1824F",
    "#FFF5CB",
    "#A5D6D1",
    "#33A7B5",
];

for (const color of vivitaSiteColors) {
    assert.match(
        styleCss,
        new RegExp(color, "i"),
        `base CSS should include VIVITA site color ${color}`,
    );
    assert.match(
        appearancePrefs,
        new RegExp(color, "i"),
        `appearance preferences should preserve VIVITA site color ${color}`,
    );
}

assert.doesNotMatch(
    styleCss,
    /--viventory-shell-start:\s*#f59e0b/i,
    "shell should no longer use the old orange-heavy start color",
);
assert.doesNotMatch(
    appearancePrefs,
    /shellStart:\s*"#f59e0b"/i,
    "appearance preferences should not restore the old orange-heavy shell",
);

console.log("VivitaPalette.test.ts passed");
