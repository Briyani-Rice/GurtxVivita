import assert from "node:assert/strict";
import type { FloorData } from "../types.ts";
import { zoneToken } from "./zoneIdentity.ts";

const floors: FloorData[] = [
    {
        id: "floor-1",
        name: "Ground",
        elements: [
            { id: "white-space", type: "compartment", x: 0, y: 0, width: 10, height: 10 },
            // Furniture sits in the same list and must not shift zone colours.
            { id: "a-chair", type: "chair", x: 0, y: 0, width: 1, height: 1 },
            { id: "tinkering-studio", type: "compartment", x: 0, y: 0, width: 10, height: 10 },
        ],
    },
    {
        id: "floor-2",
        name: "Upper",
        elements: [
            { id: "roof-terrace", type: "compartment", x: 0, y: 0, width: 10, height: 10 },
        ],
    },
];

// Areas get a stable colour by their position in the floor plan, so the same
// area is the same colour on the card and on the map.
assert.equal(zoneToken("white-space", floors), "var(--vk-zone-1)");
assert.equal(zoneToken("tinkering-studio", floors), "var(--vk-zone-2)");
assert.equal(zoneToken("roof-terrace", floors), "var(--vk-zone-3)");

// Stable across calls — a dot must not change colour on re-render.
assert.equal(zoneToken("tinkering-studio", floors), zoneToken("tinkering-studio", floors));

// Unknown, missing, and empty inputs have no zone rather than a wrong one.
assert.equal(zoneToken("does-not-exist", floors), null);
assert.equal(zoneToken(undefined, floors), null);
assert.equal(zoneToken("white-space", []), null);

// Only compartments are areas. A chair is not a zone.
assert.equal(zoneToken("a-chair", floors), null);

// More than seven areas wrap rather than running off the end of the token set.
const many: FloorData[] = [{
    id: "f",
    name: "F",
    elements: Array.from({ length: 9 }, (_, index) => ({
        id: `area-${index}`, type: "compartment" as const, x: 0, y: 0, width: 1, height: 1,
    })),
}];
assert.equal(zoneToken("area-0", many), "var(--vk-zone-1)");
assert.equal(zoneToken("area-7", many), "var(--vk-zone-1)");
assert.equal(zoneToken("area-8", many), "var(--vk-zone-2)");

console.log("zoneIdentity tests passed");
