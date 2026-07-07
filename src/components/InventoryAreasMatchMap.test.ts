import assert from "node:assert/strict";
import type { Material } from "../types.ts";
import {
    assignMaterialToMapArea,
    inventoryAreaIds,
    inventoryCompartments,
    inventoryFloors,
    normalizeMaterialArea,
    starterMaterials,
} from "./inventoryStore.ts";

const mapElementIds = new Set(inventoryFloors.flatMap(floor => floor.elements.map(element => element.id)));
const compartmentIds = new Set(inventoryCompartments.map(compartment => compartment.id));

for (const id of inventoryAreaIds) {
    assert.equal(mapElementIds.has(id), true, `${id} should exist on the room map`);
    assert.equal(compartmentIds.has(id), true, `${id} should exist in admin/user areas`);
}

assert.equal(compartmentIds.has("comp-101"), false, "placeholder A101 area should not be exposed");
assert.equal(compartmentIds.has("comp-102"), false, "placeholder A102 area should not be exposed");
assert.equal(compartmentIds.has("comp-201"), false, "placeholder B201 area should not be exposed");

for (const material of starterMaterials) {
    assert.equal(
        compartmentIds.has(material.compartmentId),
        true,
        `${material.name} should be assigned to a real map area`,
    );
}

const legacyMaterial: Material = {
    id: "pb-3d-printer",
    name: "3D Printer",
    description: "Bambu Lab printer for prototypes",
    quantity: 1,
    unit: "unit",
    compartmentId: "comp-102",
    createdAt: "2026-07-07T12:00:00.000Z",
};

const assignedArea = assignMaterialToMapArea(legacyMaterial);
assert.equal(inventoryAreaIds.includes(assignedArea), true);
assert.equal(assignedArea, assignMaterialToMapArea(legacyMaterial), "legacy assignment should be stable");
assert.equal(normalizeMaterialArea(legacyMaterial).compartmentId, assignedArea);

const validMaterial = { ...legacyMaterial, compartmentId: "pegboard-storage" };
assert.equal(normalizeMaterialArea(validMaterial).compartmentId, "pegboard-storage");

console.log("InventoryAreasMatchMap.test.ts passed");
