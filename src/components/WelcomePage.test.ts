import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");

assert.match(
    appSource,
    /Welcome to VIVITA/,
    "Welcome page should have a warmer VIVITA-oriented headline",
);

assert.match(
    appSource,
    /--viventory-welcome-bg/,
    "Welcome page should use theme-aware welcome background variables",
);

assert.match(
    appSource,
    /Open Maker Bot/,
    "Welcome page should guide users into the Maker Bot experience",
);

assert.match(
    appSource,
    /vivitaSpaceImage/,
    "Welcome page should use a real VIVITA space image asset",
);

assert.match(
    appSource,
    /Our Vivistop @ 10 Kampong Eunos/,
    "Welcome page should borrow the original site's place-based makerspace language",
);

assert.match(
    appSource,
    /Youth are our bosses/,
    "Welcome page should echo the original site's youth-led tone",
);

assert.doesNotMatch(
    appSource,
    /background:\s*"#ffffff"/,
    "Welcome page should not force a white background that ignores dark mode",
);

console.log("WelcomePage source checks passed");
