import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./AdminView.tsx", import.meta.url), "utf8");

assert.match(
    source,
    /react-resizable-panels/,
    "AdminView should use the existing resizable panels dependency for adjustable layout",
);

assert.match(
    source,
    /PanelResizeHandle/,
    "AdminView should expose a resize handle between admin panes",
);

assert.match(
    source,
    /setSelectedElement/,
    "AdminView should keep an adjustable selected storage area",
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
