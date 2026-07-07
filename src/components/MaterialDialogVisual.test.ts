import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./MaterialDialog.tsx", import.meta.url), "utf8");

assert.match(
    source,
    /overlay:/,
    "MaterialDialog should use explicit local overlay styles",
);

assert.match(
    source,
    /position:\s*'fixed'/,
    "MaterialDialog overlay must be fixed so dialog text cannot fall into the page flow",
);

assert.doesNotMatch(
    source,
    /className="fixed inset-0/,
    "MaterialDialog should not depend on utility classes for modal positioning",
);

console.log("MaterialDialog visual source checks passed");
