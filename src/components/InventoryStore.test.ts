import assert from "node:assert/strict";
import { materialToMakerItem } from "./inventoryStore.ts";
import { answerMakerQuery } from "./makerspaceData.ts";

const printerItem = materialToMakerItem(
    {
        id: "pb-3d-printer",
        name: "3D Printer",
        description: "Bambu Lab printer for prototypes",
        quantity: 1,
        unit: "unit",
        compartmentId: "comp-102",
        createdAt: "2026-07-07T12:00:00.000Z",
    },
    [
        {
            id: "comp-102",
            number: "A102",
            name: "Electronics Lab",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            color: "#33A7B5",
        },
    ],
);

assert.equal(printerItem.id, "pb-3d-printer");
assert.equal(printerItem.name, "3D Printer");
assert.equal(printerItem.location.zone, "Electronics Lab");
assert.equal(printerItem.quantity, 1);
assert.deepEqual(
    printerItem.aliases,
    ["3d printer", "bambu lab printer for prototypes"],
    "dynamic Maker Bot aliases should include normalized name and description",
);

const answer = answerMakerQuery("Where is the 3D printer?", [printerItem], []);
assert.equal(answer.intent, "locate");
assert.equal(answer.item?.name, "3D Printer");
assert.match(answer.sections[0].body, /Electronics Lab/);

console.log("InventoryStore.test.ts passed");
