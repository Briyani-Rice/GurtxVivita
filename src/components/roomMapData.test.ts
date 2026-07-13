import assert from "node:assert/strict";
import {
    vivitaFloor,
    vivitaMaterials,
} from "./roomMapData.ts";

function area(id: string) {
    const found = vivitaFloor.elements.find(element => element.id === id);
    assert.ok(found, `Expected area ${id} to exist`);
    return found;
}

assert.ok(
    area("white-space").x < area("tinkering-studio").x,
    "White Space should sit left of Tinkering Studio based on the orientation video"
);

assert.ok(
    area("pegboard-storage").x > area("tinkering-studio").x,
    "Pegboard storage should sit on the opposite side of the Tinkering Studio tables"
);

assert.ok(
    area("window-wall").y < area("tinkering-studio").y,
    "The window wall should be above the Tinkering Studio in map orientation"
);

assert.ok(
    vivitaMaterials.some(material => material.compartmentId === "pegboard-storage"),
    "Pegboard storage should have inventory assigned"
);

assert.equal(
    vivitaMaterials.length,
    905,
    "VIVITA inventory export should import every named material row",
);

assert.ok(
    vivitaMaterials.some(material =>
        material.name === "Lionsforge Laser Cutter" &&
        material.quantity === 1 &&
        material.compartmentId === "tinkering-studio" &&
        material.description.includes("Category: Machine") &&
        material.description.includes("Where to find it: Tinkering Studio")
    ),
    "Imported machine rows should retain quantity, category, and location details",
);

assert.ok(
    vivitaMaterials.some(material =>
        material.name === "Caulking Gun" &&
        material.quantity === 1 &&
        material.compartmentId === "pegboard-storage" &&
        material.description.includes("Used for: plastic, wood")
    ),
    "Imported hand-tool rows should retain tool usage details",
);

assert.ok(
    vivitaMaterials.some(material =>
        material.name === "Corrugated Paper Roll" &&
        material.quantity === 0 &&
        material.compartmentId === "vivi-shelving" &&
        material.description.includes("Stock status: In Stock")
    ),
    "Blank quantity rows should import as zero while retaining stock status",
);

console.log("roomMapData tests passed");
