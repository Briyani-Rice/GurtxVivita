// Staff enter image/video links by hand, so treat them as untrusted: only
// http(s) URLs are allowed (blocks javascript:, data:, file:, etc.), and
// opening goes through the Tauri opener plugin when packaged, since
// target="_blank"/window.open does nothing inside the webview.

export function isSafeHttpUrl(value: string | undefined | null): boolean {
    if (!value) return false;

    try {
        const url = new URL(value.trim());
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function isTauriRuntime(): boolean {
    return typeof window !== "undefined"
        && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

export async function openExternalUrl(value: string): Promise<void> {
    if (!isSafeHttpUrl(value)) {
        return;
    }

    const url = value.trim();

    if (isTauriRuntime()) {
        try {
            const { openUrl } = await import("@tauri-apps/plugin-opener");
            await openUrl(url);
            return;
        } catch (error) {
            console.warn("Unable to open the link with the Tauri opener; falling back.", error);
        }
    }

    window.open(url, "_blank", "noopener,noreferrer");
}
