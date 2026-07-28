export type DisplayMode = "normal" | "tv" | "kiosk";

export function resolveDisplayMode(
    search: string = typeof window !== "undefined" ? window.location.search : "",
): DisplayMode {
    const value = new URLSearchParams(search).get("display")?.toLowerCase();
    if (value === "tv" || value === "kiosk") {
        return value;
    }
    return "normal";
}
