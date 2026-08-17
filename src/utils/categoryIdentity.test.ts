import assert from "node:assert/strict";
import { CATEGORY_HUES, categoryIdentity } from "./categoryIdentity.ts";

// Categories are staff-typed free text, so recognised words get a deliberate
// icon and everything else must still land somewhere sensible.
assert.equal(categoryIdentity("Hand tool").icon, "wrench");
assert.equal(categoryIdentity("Power Tool").icon, "wrench");
assert.equal(categoryIdentity("Machine").icon, "cog");
assert.equal(categoryIdentity("Machine Replacement Parts").icon, "cog");
assert.equal(categoryIdentity("Adhesive. Fasteners. Wires").icon, "droplet");
assert.equal(categoryIdentity("Electronic Hardwares & Components").icon, "cpu");
assert.equal(categoryIdentity("Device").icon, "cpu");
assert.equal(categoryIdentity("Materials").icon, "layers");
assert.equal(categoryIdentity("Packing Materials").icon, "box");
assert.equal(categoryIdentity("Storage Containers").icon, "box");
assert.equal(categoryIdentity("Photography Equipments").icon, "camera");
assert.equal(categoryIdentity("Display Props").icon, "sparkles");
assert.equal(categoryIdentity("Kit").icon, "package");

// Matching is case-insensitive.
assert.equal(categoryIdentity("HAND TOOL").icon, categoryIdentity("hand tool").icon);

// An unrecognised category still gets an identity rather than a blank card.
const unknown = categoryIdentity("VIVIPANEL supplies");
assert.equal(typeof unknown.icon, "string");
assert.ok(CATEGORY_HUES.includes(unknown.hue), "fallback hue must come from the curated set");

// Determinism: the same name must produce the same hue on every device and
// every reload, or a category changes colour when the page refreshes.
for (const name of ["VIVIPANEL supplies", "Collaterals", "Findings. Hardware", "Misc"]) {
    assert.equal(
        categoryIdentity(name).hue,
        categoryIdentity(name).hue,
        `${name} must hash to a stable hue`,
    );
}
assert.equal(categoryIdentity("Collaterals").hue, categoryIdentity("collaterals").hue);

// Every hue in play — keyword or fallback — comes from the curated set, so no
// combination can clash with the brand.
assert.equal(CATEGORY_HUES.length, 8, "the curated set is exactly 8 hues");
for (const name of [
    "Hand tool", "Machine", "Adhesive. Fasteners. Wires", "Device", "Materials",
    "Packing Materials", "Photography Equipments", "Display Props", "Kit",
    "VIVIPANEL supplies", "Collaterals", "Findings. Hardware", "Misc", "Appliances",
    "Cleaning Supply", "First Aid Equipment", "Protectives", "VIVIWARE CELL",
]) {
    assert.ok(
        CATEGORY_HUES.includes(categoryIdentity(name).hue),
        `${name} should resolve to a curated hue`,
    );
}

// Empty and whitespace names are real in this data and must not throw.
assert.ok(CATEGORY_HUES.includes(categoryIdentity("").hue));
assert.ok(CATEGORY_HUES.includes(categoryIdentity("   ").hue));

console.log("categoryIdentity tests passed");
