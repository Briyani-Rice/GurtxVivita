import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DICTIONARIES } from "../i18n/i18n.ts";
import { Language } from "../types.ts";

const shellSource = readFileSync(new URL("./KioskShell.tsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const userViewSource = readFileSync(new URL("./UserView.tsx", import.meta.url), "utf8");

// Kiosk mode must render the simplified shell, not the raw chat kiosk it used
// to drop children straight into.
assert.match(
    appSource,
    /displayMode === "kiosk"[\s\S]{0,200}<KioskShell \/>/,
    "Kiosk display mode should render KioskShell",
);

// The desktop tab strip and command bar must not reach the child-facing shell.
for (const forbidden of ["RenderTabBar", "CommandBar", "Titlebar", "handleNewTab"]) {
    assert.doesNotMatch(
        shellSource,
        new RegExp(forbidden),
        `KioskShell must not use the desktop shell control "${forbidden}"`,
    );
}

// Exactly the three agreed destinations, in order.
assert.match(
    shellSource,
    /KIOSK_DESTINATIONS: KioskDestination\[\] = \['find', 'ask', 'map'\]/,
    "Kiosk navigation should offer find, ask, and map in that order",
);

// Destinations must be real buttons so a TV remote's D-pad can focus them.
assert.match(
    shellSource,
    /<button[\s\S]*type="button"/,
    "Kiosk destinations should be focusable buttons for D-pad navigation",
);

// Touch targets need to stay large enough for a child at a kiosk.
const minHeight = shellSource.match(/navBtn:[\s\S]*?minHeight: (\d+)/);
assert.ok(minHeight, "Kiosk nav buttons should declare a minimum height");
assert.ok(
    Number(minHeight![1]) >= 64,
    `Kiosk nav buttons should be at least 64px tall, found ${minHeight![1]}px`,
);

// TV panels crop the frame edges, so the shell must respect the safe area.
assert.match(
    shellSource,
    /env\(safe-area-inset-bottom\)/,
    "Kiosk nav bar should respect the bottom safe area for TV overscan",
);

// UserView has to be able to give up its own tab strip, or the kiosk would show
// two competing navigations.
assert.match(
    userViewSource,
    /showTabBar = true/,
    "UserView should default to showing its tab bar",
);
assert.match(
    shellSource,
    /showTabBar=\{false\}/,
    "KioskShell should suppress the inner UserView tab bar",
);

// Switching destinations must not remount UserView and lose search state, so
// UserView follows initialTab rather than being keyed.
assert.match(
    userViewSource,
    /useEffect\(\(\) => \{\s*setActiveTab\(initialTab\);\s*\}, \[initialTab\]\)/,
    "UserView should follow initialTab changes from an outer shell",
);

// Every kiosk label must exist in every language, or the nav bar shows a
// mix of languages after switching.
for (const key of ["kiosk.navLabel", "kiosk.navFind", "kiosk.navAsk", "kiosk.navMap"]) {
    for (const language of Object.values(Language)) {
        const value = DICTIONARIES[language][key as keyof (typeof DICTIONARIES)[Language]];
        assert.ok(
            typeof value === "string" && value.trim().length > 0,
            `Missing translation for "${key}" in ${language}`,
        );
    }
}

console.log("KioskShell source checks passed");
