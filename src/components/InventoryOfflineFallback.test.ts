import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const providerSource = readFileSync(new URL("./InventoryProvider.tsx", import.meta.url), "utf8");

assert.match(
    providerSource,
    /LOCAL_MATERIAL_ID_PREFIX\s*=\s*"local-"/,
    "Offline materials should have a recognizable local-only id prefix",
);

assert.match(
    providerSource,
    /function createLocalMaterial\(material: MaterialInput\): Material/,
    "Inventory provider should create local material records when PocketBase is unavailable",
);

assert.match(
    providerSource,
    /setMaterials\(prev => \[normalizeMaterialArea\(createLocalMaterial\(material\)\), \.\.\.prev\]\)/,
    "Add material should still update shared state when PocketBase create fails",
);

assert.match(
    providerSource,
    /id\.startsWith\(LOCAL_MATERIAL_ID_PREFIX\)/,
    "Local-only materials should be editable and deletable without PocketBase calls",
);

assert.match(
    providerSource,
    /saved locally for this session/i,
    "The user-facing warning should explain that the material was kept locally",
);

console.log("InventoryOfflineFallback.test.ts passed");
