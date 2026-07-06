import { invoke } from "@tauri-apps/api/core";

type BundledDocs = Record<string, () => Promise<string> | string>;

export type TauriInvoke = <T>(
    command: string,
    args?: Record<string, unknown>
) => Promise<T>;

export type ElectronDocsApi = {
    getMdFiles?: () => Promise<string[]> | string[];
    loadFileContent?: (path: string) => Promise<string | String> | string | String;
};

declare global {
    interface Window {
        electron?: ElectronDocsApi;
    }
}

type ImportMetaWithGlob = ImportMeta & {
    glob?: (
        pattern: string,
        options: {
            eager?: boolean;
            query?: string;
            import?: string;
        }
    ) => BundledDocs;
};

const importMeta = import.meta as ImportMetaWithGlob;

const bundledMarkdownFiles: BundledDocs =
    typeof importMeta.glob === "function"
        ? importMeta.glob("./Resources/MDFiles/*.md", {
            query: "?raw",
            import: "default",
        }) as unknown as BundledDocs
        : {};

function getElectronDocsApi(): ElectronDocsApi | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    return window.electron;
}

function getBundledMarkdownPaths(bundledDocs: BundledDocs): string[] {
    return Object.keys(bundledDocs).sort();
}

export async function getDocsMarkdownFiles(
    electronApi: ElectronDocsApi | undefined = getElectronDocsApi(),
    tauriInvoke: TauriInvoke = invoke,
    bundledDocs: BundledDocs = bundledMarkdownFiles
): Promise<string[]> {
    if (electronApi?.getMdFiles) {
        return Promise.resolve(electronApi.getMdFiles());
    }

    const bundledPaths = getBundledMarkdownPaths(bundledDocs);

    if (bundledPaths.length > 0) {
        return bundledPaths;
    }

    return tauriInvoke<string[]>("get_md_files");
}

export async function loadDocsMarkdownFileContent(
    path: string,
    electronApi: ElectronDocsApi | undefined = getElectronDocsApi(),
    tauriInvoke: TauriInvoke = invoke,
    bundledDocs: BundledDocs = bundledMarkdownFiles
): Promise<string> {
    if (electronApi?.loadFileContent) {
        const content = await Promise.resolve(electronApi.loadFileContent(path));
        return String(content);
    }

    if (bundledDocs[path]) {
        return Promise.resolve(bundledDocs[path]());
    }

    return tauriInvoke<string>("load_file_content", { file_path: path });
}
