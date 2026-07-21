import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./firebaseInventory.ts", import.meta.url), "utf8");

assert.match(source, /MATERIALS_COLLECTION\s*=\s*"materials"/);
assert.match(source, /REQUESTS_COLLECTION\s*=\s*"materialRequests"/);
assert.match(source, /getFirebaseFirestore/);
assert.match(source, /listMaterialRecords/);
assert.match(source, /createMaterialRecord/);
assert.match(source, /updateMaterialRecord/);
assert.match(source, /deleteMaterialRecord/);
assert.match(source, /listMaterialRequestRecords/);
assert.match(source, /createMaterialRequestRecord/);
assert.match(source, /approveMaterialRequestRecord/);
assert.match(source, /declineMaterialRequestRecord/);
assert.match(
    source,
    /runTransaction/,
    "Approving a request should update material quantity and request status atomically",
);

console.log("Firebase inventory service source checks passed");
