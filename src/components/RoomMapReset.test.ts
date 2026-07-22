import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./RoomMap.tsx", import.meta.url), "utf8");

assert.match(
    source,
    /function fitCameraToMap/,
    "RoomMap should calculate a fit-to-view camera instead of resetting to a fixed corner",
);

assert.match(
    source,
    /MAP_BOUNDS/,
    "RoomMap reset should fit the full drawn plan bounds",
);

assert.match(
    source,
    /containerRef\.current\?\.getBoundingClientRect/,
    "RoomMap reset should use the current visible map panel size",
);

assert.doesNotMatch(
    source,
    /cam\.current\.pan\s*=\s*\{\s*x:\s*40,\s*y:\s*40\s*\}/,
    "RoomMap reset should not jump back to the old top-left crop",
);

console.log("RoomMap reset source checks passed");
