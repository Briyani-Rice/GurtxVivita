import { Language } from "../../types";

export type AppearanceTheme = "light" | "system" | "dark";

export interface AppearancePrefs {
    theme: AppearanceTheme;
    fontSize: number;
    language: Language;
}

export const APPEARANCE_PREFS_KEY = "viventory_appearance_prefs";

const DEFAULT_PREFS: AppearancePrefs = {
    theme: "light",
    fontSize: 14,
    language: Language.English,
};

const PALETTES = {
    light: {
        bg: "#f6f8fb",
        surface: "#ffffff",
        mutedSurface: "#f1f5f9",
        text: "#111827",
        mutedText: "#64748b",
        border: "#dbe3ee",
        tab: "#dddddd",
        activeTab: "#cce8f4",
        control: "#1f1f1f",
        controlText: "#ffffff",
    },
    dark: {
        bg: "#111827",
        surface: "#1f2937",
        mutedSurface: "#273449",
        text: "#f8fafc",
        mutedText: "#cbd5e1",
        border: "#40506a",
        tab: "#273449",
        activeTab: "#164e63",
        control: "#0f172a",
        controlText: "#f8fafc",
    },
};

const LANGUAGE_TAGS: Record<Language, string> = {
    [Language.English]: "en",
    [Language.Chinese]: "zh",
    [Language.Japanese]: "ja",
    [Language.Malay]: "ms",
    [Language.Tamil]: "ta",
};

function clampFontSize(fontSize: number): number {
    if (!Number.isFinite(fontSize)) return DEFAULT_PREFS.fontSize;
    return Math.min(64, Math.max(8, Math.round(fontSize)));
}

function isTheme(value: unknown): value is AppearanceTheme {
    return value === "light" || value === "system" || value === "dark";
}

function isLanguage(value: unknown): value is Language {
    return Object.values(Language).includes(value as Language);
}

export function normalizeAppearancePrefs(value: Partial<AppearancePrefs> = {}): AppearancePrefs {
    return {
        theme: isTheme(value.theme) ? value.theme : DEFAULT_PREFS.theme,
        fontSize: clampFontSize(Number(value.fontSize ?? DEFAULT_PREFS.fontSize)),
        language: isLanguage(value.language) ? value.language : DEFAULT_PREFS.language,
    };
}

export function defaultAppearancePrefs(): AppearancePrefs {
    return { ...DEFAULT_PREFS };
}

export function loadAppearancePrefs(storage: Storage = window.localStorage): AppearancePrefs {
    try {
        const raw = storage.getItem(APPEARANCE_PREFS_KEY);
        if (!raw) return defaultAppearancePrefs();
        return normalizeAppearancePrefs(JSON.parse(raw));
    } catch {
        return defaultAppearancePrefs();
    }
}

export function saveAppearancePrefs(
    prefs: AppearancePrefs,
    storage: Storage = window.localStorage,
): AppearancePrefs {
    const normalized = normalizeAppearancePrefs(prefs);
    storage.setItem(APPEARANCE_PREFS_KEY, JSON.stringify(normalized));
    return normalized;
}

function resolveTheme(theme: AppearanceTheme): "light" | "dark" {
    if (theme !== "system") return theme;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyAppearancePrefs(prefs: AppearancePrefs): AppearancePrefs {
    const normalized = normalizeAppearancePrefs(prefs);
    const resolvedTheme = resolveTheme(normalized.theme);
    const palette = PALETTES[resolvedTheme];
    const root = document.documentElement;

    root.dataset.viventoryTheme = resolvedTheme;
    root.dataset.viventoryThemePreference = normalized.theme;
    root.lang = LANGUAGE_TAGS[normalized.language];
    root.style.fontSize = `${normalized.fontSize}px`;
    root.style.colorScheme = resolvedTheme;

    root.style.setProperty("--viventory-bg", palette.bg);
    root.style.setProperty("--viventory-surface", palette.surface);
    root.style.setProperty("--viventory-muted-surface", palette.mutedSurface);
    root.style.setProperty("--viventory-text", palette.text);
    root.style.setProperty("--viventory-muted-text", palette.mutedText);
    root.style.setProperty("--viventory-border", palette.border);
    root.style.setProperty("--viventory-tab", palette.tab);
    root.style.setProperty("--viventory-active-tab", palette.activeTab);
    root.style.setProperty("--viventory-control", palette.control);
    root.style.setProperty("--viventory-control-text", palette.controlText);
    root.style.setProperty("--viventory-font-size", `${normalized.fontSize}px`);

    document.body.style.background = palette.bg;
    document.body.style.color = palette.text;

    window.dispatchEvent(
        new CustomEvent("viventory:appearance-change", {
            detail: normalized,
        }),
    );

    return normalized;
}
