import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const i18nSource = readFileSync(new URL("../i18n/i18n.ts", import.meta.url), "utf8");

assert.match(
    i18nSource,
    /Welcome to VIVITA/,
    "Welcome page should have a warmer VIVITA-oriented headline",
);
assert.match(
    appSource,
    /t\("welcome\.heading"\)/,
    "Welcome page should render the translated headline",
);

assert.match(
    appSource,
    /--viventory-welcome-bg/,
    "Welcome page should use theme-aware welcome background variables",
);

assert.match(
    i18nSource,
    /Our Vivistop @ 10 Kampong Eunos/,
    "Welcome page should keep the place-based makerspace language",
);

assert.doesNotMatch(
    appSource,
    /vivitaSpaceImage|vivitaCommunityImage/,
    "Minimalist welcome page should not render hero photo collages",
);

assert.doesNotMatch(
    appSource,
    /Youth are our bosses|Make, test, share/,
    "Minimalist welcome page should drop the marketing card stack",
);

assert.match(
    appSource,
    /quickLinks/,
    "Welcome page should offer quiet quick links into the main tabs",
);

assert.doesNotMatch(
    appSource,
    /new OpenTabCommand\("Room Map"/,
    "Room Map should not be available as a separate command tab",
);

assert.doesNotMatch(
    appSource,
    /label:\s*"Room Map"/,
    "Welcome quick links should route users to Inventory instead of a separate Room Map window",
);

assert.match(
    i18nSource,
    /Press ⌘Y or use the command bar/,
    "Welcome page should point makers at the command bar",
);
assert.match(
    appSource,
    /t\("welcome\.hint"\)/,
    "Welcome page should render the translated command bar hint",
);

assert.doesNotMatch(
    appSource,
    /background:\s*"#ffffff"/,
    "Welcome page should not force a white background that ignores dark mode",
);

console.log("WelcomePage source checks passed");
