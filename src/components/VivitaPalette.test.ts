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

assert.match(
    styleCss,
    /--viventory-shell-start:\s*#ff7a1a/i,
    "shell should use a vivid VIVITA orange start color",
);
assert.match(
    styleCss,
    /--viventory-shell-mid:\s*#f59e0b/i,
    "shell should keep a warm golden middle color",
);
assert.match(
    styleCss,
    /--viventory-shell-end:\s*#33A7B5/i,
    "shell should end on the VIVITA teal accent instead of a dull brown",
);
assert.match(
    appearancePrefs,
    /shellStart:\s*"#ff7a1a"/i,
    "appearance preferences should restore the warmer shell start color",
);

console.log("VivitaPalette.test.ts passed");
