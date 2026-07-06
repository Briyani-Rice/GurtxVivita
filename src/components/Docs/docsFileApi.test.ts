import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./docsFileApi.ts", import.meta.url), "utf8");

assert.match(
    source,
    /import\.meta\.glob\("\.\/Resources\/MDFiles\/\*\.md"/,
    "Docs markdown files should be bundled through a direct Vite import.meta.glob call"
);

assert.match(
    source,
    /tauriInvoke<string>\("load_file_content",\s*\{\s*filePath:\s*path\s*\}\)/,
    "Tauri load_file_content should receive the camelCase filePath argument"
);

assert.doesNotMatch(
    source,
    /file_path:\s*path/,
    "The old snake_case Tauri argument should not be used from JavaScript"
);

console.log("docsFileApi tests passed");
