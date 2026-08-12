import assert from "node:assert/strict";
import {
    DISPLAY_MODE_STORAGE_KEY,
    type DisplayModeStorage,
    parseDisplayMode,
    readStoredDisplayMode,
    resolveDisplayMode,
    storeDisplayMode,
} from "./displayMode.ts";

function fakeStorage(initial: Record<string, string> = {}): DisplayModeStorage & {
    data: Record<string, string>;
} {
    const data = { ...initial };
    return {
        data,
        getItem: (key: string) => (key in data ? data[key] : null),
        setItem: (key: string, value: string) => {
            data[key] = value;
        },
    };
}

// Query parameter behaviour is unchanged. No storage is passed, and node has no
// localStorage, so these exercise the "nothing persisted" path.
assert.equal(resolveDisplayMode("?display=tv"), "tv");
assert.equal(resolveDisplayMode("?display=kiosk"), "kiosk");
assert.equal(resolveDisplayMode("?display=normal"), "normal");
assert.equal(resolveDisplayMode(""), "normal", "empty search is normal");
assert.equal(resolveDisplayMode("?foo=bar"), "normal", "missing param is normal");
assert.equal(resolveDisplayMode("?display=banana"), "normal", "unknown value is normal");
assert.equal(resolveDisplayMode("?display=TV"), "tv", "value is case-insensitive");

// parseDisplayMode rejects anything that is not a known mode.
assert.equal(parseDisplayMode("kiosk"), "kiosk");
assert.equal(parseDisplayMode("  TV  "), "tv");
assert.equal(parseDisplayMode("banana"), null);
assert.equal(parseDisplayMode(null), null);
assert.equal(parseDisplayMode(undefined), null);
assert.equal(parseDisplayMode(""), null);

// A mode given by query parameter is persisted, so a native build that was
// launched once with a mode keeps it on the next launch.
const persisted = fakeStorage();
assert.equal(resolveDisplayMode("?display=kiosk", persisted), "kiosk");
assert.equal(persisted.data[DISPLAY_MODE_STORAGE_KEY], "kiosk");

// With no query parameter, the stored mode is used.
assert.equal(resolveDisplayMode("", persisted), "kiosk", "falls back to stored mode");
assert.equal(resolveDisplayMode("?foo=bar", persisted), "kiosk");

// An explicit query parameter overrides and replaces what was stored.
assert.equal(resolveDisplayMode("?display=tv", persisted), "tv");
assert.equal(persisted.data[DISPLAY_MODE_STORAGE_KEY], "tv");

// An unknown query value does not clobber a good stored mode.
assert.equal(resolveDisplayMode("?display=banana", persisted), "tv");
assert.equal(persisted.data[DISPLAY_MODE_STORAGE_KEY], "tv");

// "normal" is a real mode, so it can reset a kiosk device back to the full app.
assert.equal(resolveDisplayMode("?display=normal", persisted), "normal");
assert.equal(persisted.data[DISPLAY_MODE_STORAGE_KEY], "normal");

// Reading and writing directly.
const direct = fakeStorage();
assert.equal(readStoredDisplayMode(direct), null, "nothing stored yet");
storeDisplayMode("tv", direct);
assert.equal(readStoredDisplayMode(direct), "tv");

// Garbage in storage is ignored rather than crashing the app.
assert.equal(readStoredDisplayMode(fakeStorage({ [DISPLAY_MODE_STORAGE_KEY]: "banana" })), null);

// A null storage (unavailable / locked-down webview) degrades to normal.
assert.equal(readStoredDisplayMode(null), null);
assert.equal(resolveDisplayMode("", null), "normal");
assert.doesNotThrow(() => storeDisplayMode("kiosk", null));

// Storage that throws on access must not take the app down with it.
const hostile: DisplayModeStorage = {
    getItem() {
        throw new Error("denied");
    },
    setItem() {
        throw new Error("denied");
    },
};
assert.equal(readStoredDisplayMode(hostile), null);
assert.equal(resolveDisplayMode("", hostile), "normal");
assert.equal(resolveDisplayMode("?display=kiosk", hostile), "kiosk", "resolves despite write failure");

console.log("displayMode tests passed");
