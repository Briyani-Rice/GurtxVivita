import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./MakerKiosk.tsx", import.meta.url), "utf8");

assert.match(
    source,
    /itemCard:[\s\S]*borderRadius:\s*6/,
    "Maker Bot right rail cards should be rectangular",
);

assert.match(
    source,
    /badge:[\s\S]*borderRadius:\s*4/,
    "Maker Bot labels should be rectangular rather than pill-shaped",
);

assert.match(
    source,
    /pegboardText/,
    "Pegboard Storage should use a dedicated high-contrast text color",
);

assert.match(
    source,
    /shell:[\s\S]*background:\s*palette\.panel/,
    "Maker Bot shell should use a full white panel background",
);

assert.match(
    source,
    /rail:[\s\S]*background:\s*palette\.panel/,
    "Maker Bot right rail should use a full white panel background",
);

assert.doesNotMatch(
    source,
    /radial-gradient\(circle at 12px 12px/,
    "Maker Bot shell should not use the dotted tinted background",
);

assert.doesNotMatch(
    source,
    /linear-gradient\(135deg, #FFF5CB/,
    "Maker Bot shell should not use the yellow-to-mint background gradient",
);

assert.doesNotMatch(
    source,
    /borderRadius:\s*(?:18|26|999)/,
    "Maker Bot should not use bubbly card or badge radii",
);

console.log("MakerKiosk visual source checks passed");
