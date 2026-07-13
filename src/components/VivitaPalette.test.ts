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
    /--viventory-bg:\s*#ffffff/i,
    "light mode base background should be full white",
);
assert.match(
    styleCss,
    /--viventory-muted-surface:\s*#ffffff/i,
    "light mode muted surfaces should be full white",
);
assert.match(
    styleCss,
    /--viventory-welcome-bg:\s*#ffffff/i,
    "light mode welcome background should be full white",
);
assert.match(
    styleCss,
    /--viventory-shell-start:\s*#ffffff/i,
    "light mode shell should start with a full white background",
);
assert.match(
    styleCss,
    /--viventory-shell-mid:\s*#ffffff/i,
    "light mode shell should stay full white through the middle",
);
assert.match(
    styleCss,
    /--viventory-shell-end:\s*#ffffff/i,
    "light mode shell should stay full white at the end",
);
assert.match(
    appearancePrefs,
    /bg:\s*"#ffffff"/i,
    "appearance preferences should set light mode app background to full white",
);
assert.match(
    appearancePrefs,
    /mutedSurface:\s*"#ffffff"/i,
    "appearance preferences should set light muted surfaces to full white",
);
assert.match(
    appearancePrefs,
    /welcomeBg:\s*"#ffffff"/i,
    "appearance preferences should set the light welcome background to full white",
);
assert.match(
    appearancePrefs,
    /shellStart:\s*"#ffffff"/i,
    "appearance preferences should use a full white light title bar",
);
assert.match(
    appearancePrefs,
    /dark:\s*{[\s\S]*shellStart:\s*"#161D26"[\s\S]*shellMid:\s*"#24262B"[\s\S]*shellEnd:\s*"#32353C"/i,
    "dark mode title bar should align with the dark settings surfaces",
);

console.log("VivitaPalette.test.ts passed");
