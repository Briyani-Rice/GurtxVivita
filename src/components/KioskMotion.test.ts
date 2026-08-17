import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const styleCss = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const userView = readFileSync(new URL("./UserView.tsx", import.meta.url), "utf8");

// Every animation is opt-out. A child who needs stillness gets the instant
// behaviour, not a degraded one.
const motionBlock = styleCss.match(
    /@media \(prefers-reduced-motion: no-preference\)[\s\S]*$/,
);
assert.ok(motionBlock, "kiosk motion must live behind a prefers-reduced-motion guard");

const guarded = motionBlock[0];
assert.match(guarded, /\.viventory-kiosk/, "motion rules must be scoped to the kiosk");
assert.match(guarded, /transition/, "motion is CSS transitions, no animation library");
assert.match(guarded, /:active/, "touch targets need a press state");

// 800ms is shorter than the glance it takes a child to look back at the screen.
const declared = userView.match(/const REQUEST_CONFIRMATION_MS\s*=\s*(\d+)/);
assert.ok(declared, "UserView must name the confirmation hold rather than inline 800");
assert.ok(
    Number(declared[1]) >= 1200,
    "the request confirmation must be held long enough to be seen",
);
assert.match(
    userView,
    /\},\s*REQUEST_CONFIRMATION_MS\)/,
    "the close timer must use the named constant",
);
assert.ok(!/\},\s*800\)/.test(userView), "the old 800ms timer must be gone");

console.log("KioskMotion tests passed");
