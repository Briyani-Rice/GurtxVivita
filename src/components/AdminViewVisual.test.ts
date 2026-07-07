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
    /In stock/,
    "Admin material cards should use direct stock status language",
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
