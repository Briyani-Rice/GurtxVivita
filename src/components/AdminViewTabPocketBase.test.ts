import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminTabSource = readFileSync(new URL("./AdminViewTab.tsx", import.meta.url), "utf8");
const providerSource = readFileSync(new URL("./InventoryProvider.tsx", import.meta.url), "utf8");

assert.match(
    providerSource,
    /listMaterialRecords/,
    "Shared inventory provider should load materials from PocketBase",
);

assert.match(
    providerSource,
    /createMaterialRecord/,
    "Shared inventory provider should create materials through PocketBase",
);

assert.match(
    providerSource,
    /updateMaterialRecord/,
    "Shared inventory provider should update materials through PocketBase",
);

assert.match(
    providerSource,
    /deleteMaterialRecord/,
    "Shared inventory provider should delete materials through PocketBase",
);

assert.match(
    providerSource,
    /useEffect/,
    "Shared inventory provider should load saved PocketBase records when the app mounts",
);

assert.match(
    adminTabSource,
    /useInventory\(\)/,
    "AdminViewTab should consume the shared inventory provider",
);

console.log("AdminViewTab PocketBase source checks passed");
