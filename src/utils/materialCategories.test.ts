import assert from "node:assert/strict";
import type { Material } from "../types.ts";
import {
    ALL_CATEGORIES,
    collectMaterialCategories,
    filterMaterialsByCategory,
    materialCategoryNames,
} from "./materialCategories.ts";

function material(id: string, category?: string): Material {
    return {
        id,
        name: id,
        description: "",
        quantity: 1,
        unit: "items",
        compartmentId: "vivi-shelving",
        createdAt: "2026-08-12T00:00:00.000Z",
        ...(category === undefined ? {} : { category }),
    };
}

// A material with no category at all contributes nothing.
assert.deepEqual(materialCategoryNames(material("a")), []);
assert.deepEqual(materialCategoryNames(material("a", "   ")), []);

// Single category, trimmed.
assert.deepEqual(materialCategoryNames(material("a", "  Materials  ")), ["Materials"]);

// Periods are part of the category name, not separators. This is the case that
// breaks if anyone switches the split to a general punctuation split.
assert.deepEqual(materialCategoryNames(material("a", "Findings. Hardware")), [
    "Findings. Hardware",
]);
assert.deepEqual(
    materialCategoryNames(material("a", "Peripheral Devices (Power. Cables. Adapters. Mouses)")),
    ["Peripheral Devices (Power. Cables. Adapters. Mouses)"],
);

// Commas separate multiple categories, the way enrichMaterial joins them.
assert.deepEqual(materialCategoryNames(material("a", "Materials, Hand tool")), [
    "Materials",
    "Hand tool",
]);

// A category repeated on one material is only counted once.
assert.deepEqual(materialCategoryNames(material("a", "Materials, materials")), ["Materials"]);

// collectMaterialCategories counts across materials, case-insensitively,
// and returns names sorted alphabetically.
const inventory = [
    material("1", "Materials"),
    material("2", "materials"),
    material("3", "Hand tool"),
    material("4", "Findings. Hardware, Materials"),
    material("5"),
];

assert.deepEqual(collectMaterialCategories(inventory), [
    { name: "Findings. Hardware", count: 1 },
    { name: "Hand tool", count: 1 },
    { name: "Materials", count: 3 },
]);

assert.deepEqual(collectMaterialCategories([]), []);

// Filtering is case-insensitive and matches any one of a material's categories.
assert.deepEqual(
    filterMaterialsByCategory(inventory, "materials").map(m => m.id),
    ["1", "2", "4"],
);
assert.deepEqual(
    filterMaterialsByCategory(inventory, "Findings. Hardware").map(m => m.id),
    ["4"],
);

// The sentinel, an empty string, and whitespace all mean "no filter".
assert.equal(filterMaterialsByCategory(inventory, ALL_CATEGORIES).length, inventory.length);
assert.equal(filterMaterialsByCategory(inventory, "").length, inventory.length);
assert.equal(filterMaterialsByCategory(inventory, "   ").length, inventory.length);

// An unknown category matches nothing rather than falling back to everything.
assert.deepEqual(filterMaterialsByCategory(inventory, "Nonexistent"), []);

console.log("materialCategories tests passed");
