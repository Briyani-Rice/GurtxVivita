import assert from "node:assert/strict";
import type { Material } from "../types";
import {
    filterMaterialsBySearch,
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
