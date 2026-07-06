import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./MakerKiosk.tsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");

assert.match(source, /answerMakerQuery/, "Maker kiosk should use the rule-based makerspace responder");
assert.match(source, /quickPrompts/, "Maker kiosk should provide quick-start prompt buttons");
assert.match(source, /kind === "safety"/, "Maker kiosk should render safety sections distinctly");
assert.match(source, /minHeight:\s*56/, "Touch targets should be large enough for tablet use");
assert.match(source, /fontSize:\s*16/, "Child-facing body text should be larger than the 14pt minimum");
assert.match(appSource, /new MakerKioskTab\(\)/, "Maker Bot should be the first default tab");

console.log("MakerKiosk source checks passed");
