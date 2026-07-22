import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./AdminView.tsx", import.meta.url), "utf8");

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
    /Name A-Z/,
    "AdminView should let staff sort materials by name",
);

assert.match(
    source,
    /Quantity high-low/,
    "AdminView should let staff sort materials by quantity",
);

assert.match(
    source,
    /Adult supervision/,
    "AdminView should expose the adult-supervision material filter result",
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
