import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./tvDisplay.css", import.meta.url), "utf8");

// A TV crops roughly 5% of every edge. Without a title-safe inset the outermost
// content is simply not on screen in the room, which is invisible in a browser
// and only shows up once it is on the wall at VIVITA.
assert.match(
    css,
    /--tv-safe-x:\s*max\(/,
    "TV root should define a horizontal title-safe inset",
);
assert.match(
    css,
    /--tv-safe-y:\s*max\(/,
    "TV root should define a vertical title-safe inset",
);

// The inset must combine reported safe areas with a floor, because most TVs
// report no insets at all yet still overscan.
for (const axis of ["--tv-safe-x", "--tv-safe-y"]) {
    const declaration = css.match(new RegExp(`${axis}:([^;]+);`))?.[1] ?? "";
    assert.match(
        declaration,
        /env\(safe-area-inset-/,
        `${axis} should respect reported safe-area insets`,
    );
    assert.match(
        declaration,
        /\d+(\.\d+)?v[wh]/,
        `${axis} should keep a viewport-relative floor for TVs that report nothing`,
    );
}

// The inset is useless unless the root actually applies it, and padding only
// stays inside a fixed, inset:0 element with border-box sizing.
assert.match(
    css,
    /\.tv-root\s*\{[^}]*padding:\s*var\(--tv-safe-y\)\s+var\(--tv-safe-x\)/s,
    "TV root should apply the title-safe inset as padding",
);
assert.match(
    css,
    /\.tv-root\s*\{[^}]*box-sizing:\s*border-box/s,
    "TV root needs border-box sizing or the padding overflows the fixed viewport",
);

// The fullscreen hint is position:fixed, so it escapes the root's padding and
// has to clear the overscan itself.
const hint = css.match(/\.tv-fullscreen-hint\s*\{([^}]*)\}/s)?.[1] ?? "";
assert.ok(hint.length > 0, "fullscreen hint rule should exist");
assert.match(
    hint,
    /top:\s*calc\([^)]*env\(safe-area-inset-top/,
    "fullscreen hint should clear the top overscan",
);
assert.match(
    hint,
    /right:\s*calc\([^)]*env\(safe-area-inset-right/,
    "fullscreen hint should clear the right overscan",
);

console.log("TV overscan source checks passed");
