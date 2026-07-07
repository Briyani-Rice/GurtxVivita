import { invoke } from "@tauri-apps/api/core";

type BundledDocs = Record<string, () => Promise<string> | string>;

export type TauriInvoke = <T>(
    command: string,
    args?: Record<string, unknown>
) => Promise<T>;

const bundledMarkdownFiles = import.meta.glob("./Resources/MDFiles/*.md", {
    query: "?raw",
    import: "default",
}) as unknown as BundledDocs;

function getBundledMarkdownPaths(bundledDocs: BundledDocs): string[] {
    return Object.keys(bundledDocs).sort();
}

export async function getDocsMarkdownFiles(
    tauriInvoke: TauriInvoke = invoke,
    bundledDocs: BundledDocs = bundledMarkdownFiles
): Promise<string[]> {
    const bundledPaths = getBundledMarkdownPaths(bundledDocs);

    if (bundledPaths.length > 0) {
        return bundledPaths;
    }

    return tauriInvoke<string[]>("get_md_files");
}

export async function loadDocsMarkdownFileContent(
    path: string,
    tauriInvoke: TauriInvoke = invoke,
    bundledDocs: BundledDocs = bundledMarkdownFiles
): Promise<string> {
    if (bundledDocs[path]) {
        return Promise.resolve(bundledDocs[path]());
    }

    return tauriInvoke<string>("load_file_content", { filePath: path });
}
