export type DisplayMode = "normal" | "tv" | "kiosk";

/** Where the persisted device mode lives. */
export const DISPLAY_MODE_STORAGE_KEY = "viventory.displayMode";

/**
 * Minimal slice of the Storage API, so the resolver can be tested without a DOM
 * and degrade safely where storage is unavailable (private mode, some webviews).
 */
export type DisplayModeStorage = {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
};

function defaultStorage(): DisplayModeStorage | null {
    try {
        return typeof localStorage === "undefined" ? null : localStorage;
    } catch {
        // Accessing localStorage throws outright in some locked-down webviews.
        return null;
    }
}

export function parseDisplayMode(value: string | null | undefined): DisplayMode | null {
    const normalized = value?.trim().toLowerCase();

    if (normalized === "tv" || normalized === "kiosk" || normalized === "normal") {
        return normalized;
    }

    return null;
}

/** Reads the device's saved mode. Returns null when nothing is stored. */
export function readStoredDisplayMode(
    storage: DisplayModeStorage | null = defaultStorage(),
): DisplayMode | null {
    try {
        return parseDisplayMode(storage?.getItem(DISPLAY_MODE_STORAGE_KEY));
    } catch {
        return null;
    }
}

/** Saves the device's mode so native builds keep it across launches. */
export function storeDisplayMode(
    mode: DisplayMode,
    storage: DisplayModeStorage | null = defaultStorage(),
): void {
    try {
        storage?.setItem(DISPLAY_MODE_STORAGE_KEY, mode);
    } catch {
        // A device that cannot persist still runs; it just forgets on relaunch.
    }
}

/**
 * Resolves how this device should present itself.
 *
 * `?display=` still wins, because that is how the hosted web build addresses a
 * specific screen. Native iOS/Android/TV builds have no URL to carry it, so a
 * mode supplied that way is persisted and reused on later launches.
 */
export function resolveDisplayMode(
    search: string = typeof window !== "undefined" ? window.location.search : "",
    storage: DisplayModeStorage | null = defaultStorage(),
): DisplayMode {
    const fromQuery = parseDisplayMode(new URLSearchParams(search).get("display"));

    if (fromQuery) {
        storeDisplayMode(fromQuery, storage);
        return fromQuery;
    }

    return readStoredDisplayMode(storage) ?? "normal";
}
