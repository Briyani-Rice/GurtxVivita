import assert from "node:assert/strict";
import {
    getDocsMarkdownFiles,
    loadDocsMarkdownFileContent,
} from "./docsFileApi.ts";

let tauriCalls = 0;

const electronApi = {
    getMdFiles: async () => ["/docs/CommandBar.md", "/docs/Roommap.md"],
    loadFileContent: async (path: string) => `# Loaded ${path}`,
};

const tauriInvoke = async <T>(): Promise<T> => {
    tauriCalls += 1;
    throw new Error("Tauri should not be called when Electron docs API exists");
};

assert.deepEqual(
    await getDocsMarkdownFiles(electronApi, tauriInvoke),
    ["/docs/CommandBar.md", "/docs/Roommap.md"]
);

assert.equal(
    await loadDocsMarkdownFileContent(
        "/docs/CommandBar.md",
        electronApi,
        tauriInvoke
    ),
    "# Loaded /docs/CommandBar.md"
);

assert.equal(tauriCalls, 0);

const bundledDocs = {
    "./Resources/MDFiles/CommandBar.md": async () => "# Command Bar",
    "./Resources/MDFiles/Roommap.md": async () => "# Room map",
};

const unavailableTauriInvoke = async <T>(): Promise<T> => {
    throw new TypeError(
        "Cannot read properties of undefined (reading 'invoke')"
    );
};

assert.deepEqual(
    await getDocsMarkdownFiles(undefined, unavailableTauriInvoke, bundledDocs),
    [
        "./Resources/MDFiles/CommandBar.md",
        "./Resources/MDFiles/Roommap.md",
    ]
);

assert.equal(
    await loadDocsMarkdownFileContent(
        "./Resources/MDFiles/CommandBar.md",
        undefined,
        unavailableTauriInvoke,
        bundledDocs
    ),
    "# Command Bar"
);

console.log("docsFileApi tests passed");
