import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

// Issue #7 — command bar empty state + keyboard flow.
const commandBar = read("../CommandBar.tsx");
assert.match(commandBar, /No matching commands/, "#7: command bar should show an empty-state message");
assert.match(commandBar, /key === "Enter"/, "#7: Enter should run the selected command");
assert.match(commandBar, /ArrowDown/, "#7: arrow keys should move the selection");

// Issue #6 — long search query must wrap, not overflow.
const userView = read("./UserView.tsx");
assert.match(userView, /overflowWrap:\s*'anywhere'/, "#6: empty state should wrap long queries");

// Issue #12 — inventory sync correctness.
const provider = read("./InventoryProvider.tsx");
assert.doesNotMatch(
    provider,
    /catch \(error\) \{\s*removeMaterial\(\);\s*showSyncError\("delete"/,
    "#12.1: a failed Firestore delete must not remove the material locally",
);
assert.match(provider, /toast\.(error|warning)/, "#12.4: sync problems should use non-blocking toasts, not alert()");
assert.doesNotMatch(provider, /[^/]\balert\(`/, "#12.4: no blocking alert() dialogs on the kiosk");
assert.match(provider, /only \$\{material\.quantity\} \$\{material\.unit\} are in stock/, "#12.3: warn when an approval exceeds stock");

// Issue #13 — room map badge counts material types and respects the theme.
const roomMap = read("./RoomMap.tsx");
assert.match(roomMap, /getAreaInventory\(materials, el\.id\)\.length/, "#13.3: map badge should count material types");
assert.match(roomMap, /isDarkTheme\(\)/, "#13.5: map background should follow the app theme");
assert.match(roomMap, /background:\s*"var\(--viventory-surface\)"/, "#13.5: detail panel should be theme-aware");

// Issue #15 — platform-aware shortcut modifier.
const app = read("../app.tsx");
assert.match(app, /hasPrimaryModifier\(event\)/, "#15: shortcuts should use the platform-aware modifier");
assert.match(app, /<Toaster /, "#12.4: a Toaster must be mounted for toasts to render");

// Issue #16.1 — a redirect in progress is not an error.
const auth = read("../services/firebaseAuth.ts");
assert.match(auth, /redirecting:\s*true/, "#16.1: the redirect fallback should flag itself as in-progress");
const loginTab = read("./LoginTab.tsx");
assert.match(loginTab, /setNoteIsSuccess\(Boolean\(res\.redirecting\)\)/, "#16.1: a redirecting note should not render as an error");

// Issue #16.4 — featured items matched by name, not drift-prone static ids.
const kiosk = read("./MakerKiosk.tsx");
assert.doesNotMatch(kiosk, /\["hot-glue-gun", "microbit", "cardboard", "leds"\]/, "#16.4: featured rail should not rely on static ids");

console.log("IssueFixes source checks passed");
