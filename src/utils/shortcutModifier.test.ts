import assert from "node:assert/strict";
import { hasPrimaryModifier, isApplePlatform, shortcutModifierLabel } from "./shortcutModifier.ts";

assert.equal(isApplePlatform("MacIntel"), true);
assert.equal(isApplePlatform("iPhone"), true);
assert.equal(isApplePlatform("Win32"), false);
assert.equal(isApplePlatform("Linux x86_64"), false);

// On Apple, ⌘ is the modifier; Ctrl alone is not.
assert.equal(hasPrimaryModifier({ metaKey: true, ctrlKey: false }, true), true);
assert.equal(hasPrimaryModifier({ metaKey: false, ctrlKey: true }, true), false);

// On Windows/Linux, Ctrl is the modifier; ⌘/meta alone is not.
assert.equal(hasPrimaryModifier({ metaKey: false, ctrlKey: true }, false), true);
assert.equal(hasPrimaryModifier({ metaKey: true, ctrlKey: false }, false), false);

// Ctrl+⌘ together (e.g. the fullscreen combo) is not the plain primary modifier.
assert.equal(hasPrimaryModifier({ metaKey: true, ctrlKey: true }, true), false);
assert.equal(hasPrimaryModifier({ metaKey: true, ctrlKey: true }, false), false);

assert.equal(shortcutModifierLabel(true), "⌘");
assert.equal(shortcutModifierLabel(false), "Ctrl");

console.log("shortcutModifier tests passed");
