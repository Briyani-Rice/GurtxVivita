import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./AdminView.tsx", import.meta.url), "utf8");
const i18nSource = readFileSync(new URL("../i18n/i18n.ts", import.meta.url), "utf8");

assert.match(
    i18nSource,
    /Makerspace operations/,
    "Admin View should use warmer operations-focused heading copy",
);
assert.match(
    source,
    /t\('admin\.eyebrow'\)/,
    "Admin View should render the translated heading copy",
);

assert.match(
    source,
    /--viventory-welcome-accent/,
    "Admin View should use shared VIVITA warm accent tokens",
);

assert.match(
    source,
    /translatedStockLabel\(language, material\)/,
    "Admin material cards should use direct stock status language",
);
assert.match(
    i18nSource,
    /"stock\.inStock": "In stock"/,
    "Stock status should have English copy in the i18n dictionary",
);

assert.match(
    source,
    /t\('admin\.reviewQueue'\)/,
    "Admin requests pane should read like an active review queue",
);
assert.match(
    i18nSource,
    /"admin\.reviewQueue": "Review queue"/,
    "Review queue heading should have English copy in the i18n dictionary",
);

assert.doesNotMatch(
    source,
    /background:\s*'#f6f8fb'/,
    "Admin View should not force the old flat background",
);

assert.match(
    source,
    /"SF Pro Text"/,
    "Admin View should use a quieter native app font stack",
);

assert.doesNotMatch(
    source,
    /borderRadius:\s*999/,
    "Admin View should avoid bubbly pill controls",
);

assert.doesNotMatch(
    source,
    /linear-gradient\(135deg, var\(--viventory-welcome-accent\)/,
    "Admin primary actions should use flatter styling",
);

console.log("AdminView visual source checks passed");
