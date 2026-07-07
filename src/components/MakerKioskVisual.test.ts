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

assert.doesNotMatch(
    source,
    /borderRadius:\s*(?:18|26|999)/,
    "Maker Bot should not use bubbly card or badge radii",
);

console.log("MakerKiosk visual source checks passed");
