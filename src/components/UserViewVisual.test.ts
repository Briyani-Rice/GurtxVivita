import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const userViewSource = readFileSync(new URL("UserView.tsx", import.meta.url), "utf8");
const i18nSource = readFileSync(new URL("../i18n/i18n.ts", import.meta.url), "utf8");

assert.match(
    i18nSource,
    /Materials studio/,
    "User materials view should use a warmer makerspace heading",
);
assert.match(
    userViewSource,
    /t\('user\.eyebrow'\)/,
    "User materials view should render the translated heading",
);

assert.match(
    userViewSource,
    /--viventory-welcome-accent/,
    "User materials view should reuse the warm VIVITA accent tokens",
);

assert.match(
    userViewSource,
    /translatedStockLabel\(language, m\)/,
    "Material cards should make stock status more scannable",
);
assert.match(
    i18nSource,
    /"stock\.inStock": "In stock"/,
    "Stock status should have English copy in the i18n dictionary",
);

assert.match(
    i18nSource,
    /Need it for a project/,
    "Request modal should use friendly project-oriented copy",
);
assert.match(
    userViewSource,
    /t\('user\.requestSub'\)/,
    "Request modal should render the translated request copy",
);

assert.match(
    userViewSource,
    /height:\s*'100%'[\s\S]*overflow:\s*'hidden'/,
    "User View should give the tab content a fixed-height shell so the materials pane can scroll",
);

assert.match(
    userViewSource,
    /overflowY:\s*'auto'/,
    "User materials page should scroll vertically inside the tab",
);

assert.match(
    userViewSource,
    /await onSubmitRequest/,
    "Request submission should wait for the shared inventory request handler",
);

assert.match(
    userViewSource,
    /t\('user\.errQty'\)/,
    "Request modal should validate invalid quantities before submitting",
);
assert.match(
    i18nSource,
    /"user\.errQty": "Enter a whole number greater than 0\."/,
    "Quantity validation should have English copy in the i18n dictionary",
);

assert.doesNotMatch(
    userViewSource,
    /background:\s*'#fff'/,
    "User View should not force plain white surfaces",
);

console.log("UserView visual source checks passed");
