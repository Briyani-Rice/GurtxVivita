import assert from "node:assert/strict";
import {
    createMaterialRecord,
    deleteMaterialRecord,
    listMaterialRecords,
    updateMaterialRecord,
} from "./pocketbaseMaterials.ts";

const calls: Array<{ method: string; args: unknown[] }> = [];

const fakeRecords = [
    {
        id: "mat-2",
        name: "Laptop",
        description: "Dell Latitude",
        quantity: 6,
        unit: "units",
        compartmentId: "comp-102",
        created: "2026-07-07 02:10:00.000Z",
    },
    {
        id: "mat-1",
        name: "HDMI Cable",
        description: "2m HDMI cable",
        quantity: 12,
        unit: "pcs",
        compartmentId: "comp-101",
        created: "2026-07-07 02:00:00.000Z",
    },
];

const fakeClient = {
    collection(name: string) {
        assert.equal(name, "materials");

        return {
            async getFullList(options: unknown) {
                calls.push({ method: "getFullList", args: [options] });
                return fakeRecords;
            },
            async create(data: unknown) {
                calls.push({ method: "create", args: [data] });
                return {
                    id: "mat-new",
                    created: "2026-07-07 03:00:00.000Z",
                    ...(data as object),
                };
            },
            async update(id: string, data: unknown) {
                calls.push({ method: "update", args: [id, data] });
                return {
                    id,
                    created: "2026-07-07 03:10:00.000Z",
                    ...(data as object),
                };
            },
            async delete(id: string) {
                calls.push({ method: "delete", args: [id] });
            },
        };
    },
};

const listed = await listMaterialRecords(fakeClient);
assert.deepEqual(
    listed.map(material => material.id),
    ["mat-2", "mat-1"],
    "list should map PocketBase records into app materials",
);
assert.equal(listed[0].createdAt, "2026-07-07 02:10:00.000Z");
assert.deepEqual(calls[0], { method: "getFullList", args: [{ sort: "-created" }] });

const created = await createMaterialRecord(fakeClient, {
    name: "Cardboard",
    description: "A3 sheets",
    quantity: 20,
    unit: "pcs",
    compartmentId: "comp-101",
});
assert.equal(created.id, "mat-new");
assert.equal(calls[1].method, "create");
assert.deepEqual(calls[1].args[0], {
    name: "Cardboard",
    description: "A3 sheets",
    quantity: 20,
    unit: "pcs",
    compartmentId: "comp-101",
});

const updated = await updateMaterialRecord(fakeClient, "mat-new", {
    name: "Cardboard",
    description: "A4 sheets",
    quantity: 18,
    unit: "pcs",
    compartmentId: "comp-101",
});
assert.equal(updated.id, "mat-new");
assert.deepEqual(calls[2], {
    method: "update",
    args: [
        "mat-new",
        {
            name: "Cardboard",
            description: "A4 sheets",
            quantity: 18,
            unit: "pcs",
            compartmentId: "comp-101",
        },
    ],
});

await deleteMaterialRecord(fakeClient, "mat-new");
assert.deepEqual(calls[3], { method: "delete", args: ["mat-new"] });

console.log("PocketBase material service checks passed");
