import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminTabSource = readFileSync(new URL("./AdminViewTab.tsx", import.meta.url), "utf8");
const providerSource = readFileSync(new URL("./InventoryProvider.tsx", import.meta.url), "utf8");

assert.match(
    providerSource,
    /subscribeMaterialRecords/,
    "Shared inventory provider should stream materials from Firebase in near real time",
);

assert.match(
    providerSource,
    /createMaterialRecord/,
    "Shared inventory provider should create materials through Firebase",
);

assert.match(
    providerSource,
    /updateMaterialRecord/,
    "Shared inventory provider should update materials through Firebase",
);

assert.match(
    providerSource,
    /deleteMaterialRecord/,
    "Shared inventory provider should delete materials through Firebase",
);

assert.match(
    providerSource,
    /subscribeMaterialRequestRecords/,
    "Shared inventory provider should stream material requests from Firebase in near real time",
);

assert.match(
    providerSource,
    /createMaterialRequestRecord/,
    "User material requests should be created in Firebase",
);

assert.match(
    providerSource,
    /approveMaterialRequestRecord/,
    "Admin approvals should update Firebase request status and material stock together",
);

assert.match(
    providerSource,
    /declineMaterialRequestRecord/,
    "Admin declines should update Firebase request status",
);

assert.match(
    providerSource,
    /approveRequestWithoutStockRecord\(request\)/,
    "Approving a request whose material is gone should still persist to Firebase, or the live subscription reverts it to pending",
);

assert.match(
    providerSource,
    /from "\.\.\/services\/firebaseInventory"/,
    "Shared inventory provider should use the Firebase inventory service",
);

assert.match(
    adminTabSource,
    /useInventory\(\)/,
    "AdminViewTab should consume the shared inventory provider",
);

console.log("AdminViewTab Firebase source checks passed");
