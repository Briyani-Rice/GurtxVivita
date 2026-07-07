import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./AdminViewTab.tsx", import.meta.url), "utf8");

assert.match(
    source,
    /listMaterialRecords/,
    "AdminViewTab should load materials from PocketBase",
);

assert.match(
    source,
    /createMaterialRecord/,
    "AdminViewTab should create materials through PocketBase",
);

assert.match(
    source,
    /updateMaterialRecord/,
    "AdminViewTab should update materials through PocketBase",
);

assert.match(
    source,
    /deleteMaterialRecord/,
    "AdminViewTab should delete materials through PocketBase",
);

assert.match(
    source,
    /useEffect/,
    "AdminViewTab should load saved PocketBase records when the admin tab mounts",
);

console.log("AdminViewTab PocketBase source checks passed");
