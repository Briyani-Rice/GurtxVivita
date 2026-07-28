import assert from "node:assert/strict";
import type { Material } from "../types.ts";
import { sortMaterials } from "./materialSort.ts";

function mat(overrides: Partial<Material> & Pick<Material, "id" | "name">): Material {
    return {
        description: "",
        quantity: 5,
        unit: "pcs",
        compartmentId: "c1",
        createdAt: "2026-07-07T12:00:00.000Z",
        ...overrides,
    };
}

const glueGun = mat({ id: "1", name: "Hot Glue Gun", location: "Pegboard", quantity: 2 });
const cardboard = mat({ id: "2", name: "Cardboard", location: "White Space", quantity: 40 });
const led = mat({ id: "3", name: "LED Lights", location: "Tinkering", quantity: 0, stockStatus: "low" });
const tape = mat({ id: "4", name: "Masking Tape", quantity: 0, stockStatus: "out-of-stock" });
const items = [glueGun, cardboard, led, tape];

const names = (list: Material[]) => list.map(m => m.name);

// default preserves incoming order and does not mutate the input.
assert.deepEqual(names(sortMaterials(items, "default")), names(items));
sortMaterials(items, "name-asc");
assert.deepEqual(names(items), ["Hot Glue Gun", "Cardboard", "LED Lights", "Masking Tape"], "input array must not be mutated");

assert.deepEqual(
    names(sortMaterials(items, "name-asc")),
    ["Cardboard", "Hot Glue Gun", "LED Lights", "Masking Tape"],
    "A–Z",
);
assert.deepEqual(
    names(sortMaterials(items, "name-desc")),
    ["Masking Tape", "LED Lights", "Hot Glue Gun", "Cardboard"],
    "Z–A",
);

// Location A→Z, and the item with no location sinks to the bottom.
assert.deepEqual(
    names(sortMaterials(items, "location")),
    ["Hot Glue Gun", "LED Lights", "Cardboard", "Masking Tape"],
    "by location, unlocated last",
);

// Hot Glue Gun infers adult supervision (keyword "hot ... gun"); it leads.
assert.equal(sortMaterials(items, "adult-first")[0].name, "Hot Glue Gun", "adult-supervision item first");

// in-stock (qty>0) → low → out-of-stock.
assert.deepEqual(
    names(sortMaterials(items, "stock")),
    ["Cardboard", "Hot Glue Gun", "LED Lights", "Masking Tape"],
    "in-stock, then low, then out",
);

console.log("materialSort tests passed");
