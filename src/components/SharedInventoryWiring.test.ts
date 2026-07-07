import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const adminTabSource = readFileSync(new URL("./AdminViewTab.tsx", import.meta.url), "utf8");
const userTabSource = readFileSync(new URL("./UserViewTab.tsx", import.meta.url), "utf8");
const makerKioskSource = readFileSync(new URL("./MakerKiosk.tsx", import.meta.url), "utf8");

assert.match(
    appSource,
    /<InventoryProvider>/,
    "App should wrap tabs in the shared inventory provider",
);

assert.match(
    adminTabSource,
    /useInventory\(\)/,
    "Admin View should consume shared inventory state",
);

assert.match(
    userTabSource,
    /useInventory\(\)/,
    "User View should consume shared inventory state",
);

assert.match(
    makerKioskSource,
    /useInventory\(\)/,
    "Maker Bot should consume shared inventory state",
);

assert.doesNotMatch(
    userTabSource,
    /private materials:\s*Material\[\]/,
    "User View should not keep a private hard-coded materials list",
);

assert.doesNotMatch(
    adminTabSource,
    /const initialRequests:\s*MaterialRequest\[\]\s*=\s*\[/,
    "Admin View should not recreate the same demo review queue on every login",
);

console.log("SharedInventoryWiring.test.ts passed");
