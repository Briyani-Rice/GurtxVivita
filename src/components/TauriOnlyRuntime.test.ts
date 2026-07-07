import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const docsApiSource = readFileSync(new URL("./Docs/docsFileApi.ts", import.meta.url), "utf8");
const packageSource = readFileSync(new URL("../../package.json", import.meta.url), "utf8");
const appShellSource = readFileSync(new URL("./AppShellVisual.test.ts", import.meta.url), "utf8");

assert.equal(
    existsSync(new URL("../../electron", import.meta.url)),
    false,
    "Electron runtime directory should be removed when desktop is Tauri-only",
);

assert.doesNotMatch(
    docsApiSource,
    /Electron|window\.electron|electronApi|getElectronDocsApi/,
    "Docs API should not keep Electron preload fallbacks",
);

assert.doesNotMatch(
    packageSource,
    /electron/,
    "package.json should not reference Electron runtime dependencies or scripts",
);

assert.doesNotMatch(
    appShellSource,
    /electron\/main|Electron desktop/,
    "App shell checks should no longer depend on Electron files",
);

console.log("Tauri-only runtime source checks passed");
