import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./AdminView.tsx", import.meta.url), "utf8");
const i18nSource = readFileSync(new URL("../i18n/i18n.ts", import.meta.url), "utf8");

assert.match(
    source,
    /\.\/ui\/resizable/,
    "AdminView should use the existing resizable panel wrapper for adjustable layout",
);

assert.match(
    source,
    /ResizableHandle/,
    "AdminView should expose a resize handle between admin panes",
);

assert.match(
    source,
    /setSelectedElement/,
    "AdminView should keep an adjustable selected storage area",
);

assert.match(
    source,
    /Admin material controls/,
    "AdminView should own the material sorting and filtering controls",
);

assert.match(
    source,
    /t\('admin\.sortNameAsc'\)/,
    "AdminView should let staff sort materials by name",
);
assert.match(
    i18nSource,
    /"admin\.sortNameAsc": "Name A-Z"/,
    "Name sort option should have English copy in the i18n dictionary",
);

assert.match(
    source,
    /t\('admin\.sortQtyDesc'\)/,
    "AdminView should let staff sort materials by quantity",
);
assert.match(
    i18nSource,
    /"admin\.sortQtyDesc": "Quantity high-low"/,
    "Quantity sort option should have English copy in the i18n dictionary",
);

assert.match(
    source,
    /t\('admin\.adultSupervision'\)/,
    "AdminView should expose the adult-supervision material filter result",
);
assert.match(
    i18nSource,
    /"admin\.adultSupervision": "Adult supervision"/,
    "Adult supervision badge should have English copy in the i18n dictionary",
);

assert.match(
    source,
    /onApproveRequest\(request\.id\)/,
    "AdminView should keep request approval controls wired",
);

assert.match(
    source,
    /onDeclineRequest\(request\.id\)/,
    "AdminView should keep request decline controls wired",
);

console.log("AdminView layout source checks passed");
