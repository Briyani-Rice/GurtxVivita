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
/**
 * True inside the Tauri webview (desktop, iOS, Android, Android TV).
 *
 * Native builds are the case that matters here: they have no URL to carry
 * `?display=`, so the device has to be told what it is some other way.
 */
export function isNativeRuntime(win: unknown = typeof window === "undefined" ? undefined : window): boolean {
    return typeof win === "object"
        && win !== null
        && ("__TAURI_INTERNALS__" in win || "__TAURI__" in win);
}

/**
 * Whether this device still has to be asked what it is.
 *
 * Only native builds are ever asked. On the web the query parameter is the
 * answer, and a plain visit should keep landing on the full app rather than
 * being interrogated. A native device is asked exactly once; after that the
 * stored mode answers for it.
 */
export function needsDeviceModeChoice(
    search: string = typeof window !== "undefined" ? window.location.search : "",
    storage: DisplayModeStorage | null = defaultStorage(),
    native: boolean = isNativeRuntime(),
): boolean {
    if (parseDisplayMode(new URLSearchParams(search).get("display"))) {
        return false;
    }

    if (!native) {
        return false;
    }

    return readStoredDisplayMode(storage) === null;
}

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
