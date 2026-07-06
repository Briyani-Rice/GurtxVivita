import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./AdminView.tsx", import.meta.url), "utf8");

assert.match(
    source,
    /Makerspace operations/,
    "Admin View should use warmer operations-focused heading copy",
);

assert.match(
    source,
    /--viventory-welcome-accent/,
    "Admin View should use shared VIVITA warm accent tokens",
);

assert.match(
    source,
    /Ready to lend/,
    "Admin material cards should use clearer stock status language",
);

assert.match(
    source,
    /Review queue/,
    "Admin requests pane should read like an active review queue",
);

assert.doesNotMatch(
    source,
    /background:\s*'#f6f8fb'/,
    "Admin View should not force the old flat background",
);

console.log("AdminView visual source checks passed");
