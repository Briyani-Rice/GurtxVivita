import assert from "node:assert/strict";
import type { Material } from "../types.ts";
import {
    getAreaInventory,
    getAreaInventoryTotal,
} from "./roomMapInventory.ts";

const materials: Material[] = [
    {
        id: "mat-1",
        name: "HDMI Cable",
        description: "2m HDMI cable",
        quantity: 12,
        unit: "pcs",
        compartmentId: "library",
        createdAt: "2026-07-06T00:00:00.000Z",
    },
    {
        id: "mat-2",
        name: "Laptop",
        description: "Dell Latitude",
        quantity: 6,
        unit: "units",
        compartmentId: "tinkering-studio",
        createdAt: "2026-07-06T00:00:00.000Z",
    },
    {
        id: "mat-3",
        name: "Craft Tools",
        description: "Shared hand tools",
        quantity: 18,
        unit: "sets",
        compartmentId: "tinkering-studio",
        createdAt: "2026-07-06T00:00:00.000Z",
    },
];

assert.deepEqual(
    getAreaInventory(materials, "tinkering-studio").map(material => ({
        name: material.name,
        quantity: material.quantity,
        unit: material.unit,
    })),
    [
        { name: "Laptop", quantity: 6, unit: "units" },
        { name: "Craft Tools", quantity: 18, unit: "sets" },
    ]
);

assert.equal(getAreaInventoryTotal(materials, "tinkering-studio"), 24);
assert.deepEqual(getAreaInventory(materials, "roof-terrace"), []);
assert.equal(getAreaInventoryTotal(materials, "roof-terrace"), 0);

console.log("roomMapInventory tests passed");
