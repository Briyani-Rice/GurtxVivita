import assert from "node:assert/strict";
import type { Material } from "../types";
import {
    filterMaterialsBySearch,
    findSubstitutes,
    normalizeMaterialSearchQuery,
} from "./materialSearch.ts";

const materials: Material[] = [
    {
        id: "mat-1",
        name: "HDMI Cable",
        description: "2m HDMI cable",
        quantity: 12,
        unit: "pcs",
        compartmentId: "comp-101",
        createdAt: "2026-07-05T00:00:00.000Z",
    },
    {
        id: "mat-2",
        name: "Laptop",
        description: "Dell Latitude Laptop",
        quantity: 5,
        unit: "units",
        compartmentId: "comp-102",
        createdAt: "2026-07-05T00:00:00.000Z",
    },
    {
        id: "mat-3",
        name: "Ethernet Cable",
        description: "Cat 6 networking cable",
        quantity: 0,
        unit: "pcs",
        compartmentId: "comp-202",
        createdAt: "2026-07-05T00:00:00.000Z",
    },
];

assert.equal(normalizeMaterialSearchQuery("  HDMI  "), "hdmi");

assert.deepEqual(
    filterMaterialsBySearch(materials, "HDMI").map(material => material.name),
    ["HDMI Cable"]
);

assert.deepEqual(
    filterMaterialsBySearch(materials, "hdmi").map(material => material.name),
    ["HDMI Cable"]
);

assert.deepEqual(
    filterMaterialsBySearch(materials, "Cable").map(material => material.name),
    ["HDMI Cable", "Ethernet Cable"]
);

assert.deepEqual(
    filterMaterialsBySearch(materials, "Latitude").map(material => material.name),
    ["Laptop"]
);

assert.deepEqual(
    filterMaterialsBySearch(materials, "   ").map(material => material.name),
    ["HDMI Cable", "Laptop", "Ethernet Cable"]
);

console.log("materialSearch tests passed");

// "Out of stock" is a dead end for a child. Offering in-stock alternatives from
// the same category is what turns a refusal into a next step.
function makeSubstituteMaterial(overrides: Partial<Material>): Material {
    return {
        id: "sub-0",
        name: "Thing",
        description: "",
        quantity: 5,
        unit: "pcs",
        category: "Adhesive. Fasteners. Wires",
        compartmentId: "comp-1",
        createdAt: "2026-07-05T00:00:00.000Z",
        ...overrides,
    };
}

const emptyGlue = makeSubstituteMaterial({ id: "s1", name: "Superglue", quantity: 0 });
const stockedGlue = makeSubstituteMaterial({ id: "s2", name: "Wood Glue", quantity: 4 });
const otherStockedGlue = makeSubstituteMaterial({ id: "s3", name: "Acrylic Glue", quantity: 2 });
const emptyPeer = makeSubstituteMaterial({ id: "s4", name: "Craft Glue Stick", quantity: 0 });
const unrelated = makeSubstituteMaterial({ id: "s5", name: "Hammer", category: "Hand tool", quantity: 9 });
const pool = [emptyGlue, stockedGlue, otherStockedGlue, emptyPeer, unrelated];

const substitutes = findSubstitutes(emptyGlue, pool);

// Only in-stock, only same-category, never the material itself.
assert.deepEqual(
    substitutes.map(m => m.id),
    ["s3", "s2"],
    "in-stock same-category peers, sorted by name for a stable order",
);
assert.ok(!substitutes.some(m => m.id === emptyGlue.id), "must not suggest the item itself");
assert.ok(!substitutes.some(m => m.id === emptyPeer.id), "must not suggest another empty item");
assert.ok(!substitutes.some(m => m.id === unrelated.id), "must not cross categories");

// The cap is respected.
assert.equal(findSubstitutes(emptyGlue, pool, 1).length, 1);
assert.equal(findSubstitutes(emptyGlue, pool, 0).length, 0);

// A material sharing more categories ranks above one sharing fewer.
const multiCategory = makeSubstituteMaterial({
    id: "s6",
    name: "Zzz Multi Glue",
    category: "Adhesive. Fasteners. Wires, Materials",
    quantity: 3,
});
const target = makeSubstituteMaterial({
    id: "s7",
    name: "Target",
    category: "Adhesive. Fasteners. Wires, Materials",
    quantity: 0,
});
const ranked = findSubstitutes(target, [target, multiCategory, stockedGlue]);
assert.equal(ranked[0].id, "s6", "more shared categories outranks alphabetical order");

// A material with no category has nothing to substitute from.
const uncategorised = makeSubstituteMaterial({ id: "s8", category: "", quantity: 0 });
assert.deepEqual(findSubstitutes(uncategorised, pool), []);

console.log("findSubstitutes tests passed");
