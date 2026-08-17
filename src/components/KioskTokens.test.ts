import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const styleCss = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const kioskShell = readFileSync(new URL("./KioskShell.tsx", import.meta.url), "utf8");

// The kiosk palette is additive and scoped to a class. Recolouring :root would
// break VivitaPalette.test.ts, which pins every light surface to #ffffff.
assert.match(
    styleCss,
    /\.viventory-kiosk\s*\{/,
    "kiosk tokens must be scoped to a .viventory-kiosk class",
);

const requiredTokens = [
    "--vk-ground",
    "--vk-surface",
    "--vk-surface-raised",
    "--vk-ink",
    "--vk-ink-muted",
    "--vk-accent",
    "--vk-accent-soft",
    "--vk-safe",
    "--vk-caution",
    "--vk-empty",
    "--vk-shadow",
    "--vk-radius",
];

for (const token of requiredTokens) {
    assert.match(styleCss, new RegExp(`${token}:`), `style.css should define ${token}`);
}

for (let zone = 1; zone <= 7; zone += 1) {
    assert.match(styleCss, new RegExp(`--vk-zone-${zone}:`), `style.css should define --vk-zone-${zone}`);
}

// Derived from the VIVITA brand, not invented.
assert.match(styleCss, /--vk-accent:\s*#33A7B5/i, "kiosk accent should be the VIVITA teal");
assert.match(styleCss, /--vk-accent-soft:\s*#A5D6D1/i, "kiosk soft accent should be the VIVITA mint");
assert.match(styleCss, /--vk-caution:\s*#A1824F/i, "kiosk caution should be the VIVITA bronze");
assert.match(styleCss, /--vk-ink:\s*#24262B/i, "kiosk ink should be the VIVITA near-black");

// The theme attribute lives on the root element, so the dark override has to be
// an ancestor selector rather than an attribute on the kiosk element itself.
assert.match(
    styleCss,
    /\[data-viventory-theme="dark"\]\s+\.viventory-kiosk\s*\{/,
    "dark kiosk tokens must key off the root theme attribute",
);

// The staff shell must keep its tested white.
assert.match(styleCss, /--viventory-bg:\s*#ffffff/i, "global light background must stay white");

assert.match(
    kioskShell,
    /className:\s*['"]viventory-kiosk['"]|className=['"]viventory-kiosk['"]/,
    "KioskShell root must carry the viventory-kiosk class",
);

console.log("KioskTokens tests passed");
