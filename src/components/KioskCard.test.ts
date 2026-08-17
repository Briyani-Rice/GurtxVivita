import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const userView = readFileSync(new URL("./UserView.tsx", import.meta.url), "utf8");
const kioskShell = readFileSync(new URL("./KioskShell.tsx", import.meta.url), "utf8");
const glyph = readFileSync(new URL("./CategoryGlyph.tsx", import.meta.url), "utf8");

// The kid card must not render the raw description. That field carries purchase
// remarks, loan history and Notion URLs.
assert.match(userView, /kioskDescription/, "UserView must route descriptions through kioskDescription");
assert.match(
    userView,
    /kioskMode\s*\?\s*kioskDescription\(m\.description\)\s*:\s*m\.description/,
    "the raw description must survive only outside kiosk mode",
);

// Substitutes replace the dead end.
assert.match(userView, /findSubstitutes/, "UserView must offer substitutes for unavailable materials");

// Category identity drives the glyph.
assert.match(userView, /CategoryGlyph/, "kiosk cards must show a category glyph");
assert.match(glyph, /categoryIdentity/, "CategoryGlyph must resolve identity from the category name");

// Every icon name in the union must have a component mapped, or a category
// silently renders nothing.
for (const icon of [
    "wrench", "cog", "droplet", "cpu", "layers", "box", "shirt", "camera", "sparkles", "package",
]) {
    assert.match(glyph, new RegExp(`\\b${icon}\\b`), `CategoryGlyph must map the "${icon}" icon`);
}

// Kiosk styling uses the scoped tokens, not the staff palette.
assert.match(userView, /--vk-/, "kiosk card styles must use the --vk-* tokens");

// An area's colour comes from the floor plan, so the dot matches the map.
assert.match(userView, /zoneToken/, "kiosk cards must colour their zone dot from the floor plan");

// The supervision flag must be visible on the card, not only inside a bot answer.
// It has to go through materialRequiresAdultSupervision: the stored safetyLevel
// field is unset on most real inventory, so reading it directly meant a laser
// cutter never got a badge.
assert.match(
    userView,
    /materialRequiresAdultSupervision\(m\)/,
    "kiosk cards must badge materials that need an adult, via the inferring helper",
);
assert.ok(
    !/m\.safetyLevel\s*===\s*['"]adult['"]/.test(userView),
    "the raw safetyLevel field must not be read directly",
);
assert.match(userView, /--vk-caution/, "the safety badge must use the caution token");

// The shell turns the mode on.
assert.match(kioskShell, /kioskMode/, "KioskShell must put UserView into kiosk mode");

console.log("KioskCard tests passed");
