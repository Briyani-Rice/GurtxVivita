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

console.log("roomMapData tests passed");
