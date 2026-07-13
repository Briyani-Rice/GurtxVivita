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
        bg: "#ffffff",
        surface: "#ffffff",
        mutedSurface: "#ffffff",
        text: "#24262B",
        mutedText: "#838998",
        border: "#D7CFBF",
        tab: "#E7E1D4",
        activeTab: "#D9EEE9",
        control: "#24262B",
        controlText: "#FFFDF6",
        welcomeBg: "#ffffff",
        welcomeCard: "rgba(255, 253, 246, 0.94)",
        welcomeAccent: "#33A7B5",
        welcomeAccent2: "#A5D6D1",
        welcomeDot: "transparent",
        welcomeFooter: "#24262B",
        shellStart: "#ffffff",
        shellMid: "#ffffff",
        shellEnd: "#ffffff",
        shellText: "#24262B",
        tabActiveBorder: "#A1824F",
    },
    dark: {
        bg: "#161D26",
        surface: "#24262B",
        mutedSurface: "#32353C",
        text: "#FFFDF6",
        mutedText: "#C9CED8",
        border: "#4B5059",
        tab: "#32353C",
        activeTab: "#234F55",
        control: "#0F141A",
        controlText: "#FFFDF6",
        welcomeBg: "#161D26",
        welcomeCard: "rgba(36, 38, 43, 0.92)",
        welcomeAccent: "#A5D6D1",
        welcomeAccent2: "#33A7B5",
        welcomeDot: "rgba(165, 214, 209, 0.22)",
        welcomeFooter: "#0F141A",
        shellStart: "#161D26",
        shellMid: "#24262B",
        shellEnd: "#32353C",
        shellText: "#FFFDF6",
        tabActiveBorder: "#A5D6D1",
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
    root.style.setProperty("--viventory-welcome-bg", palette.welcomeBg);
    root.style.setProperty("--viventory-welcome-card", palette.welcomeCard);
    root.style.setProperty("--viventory-welcome-accent", palette.welcomeAccent);
    root.style.setProperty("--viventory-welcome-accent-2", palette.welcomeAccent2);
    root.style.setProperty("--viventory-welcome-dot", palette.welcomeDot);
    root.style.setProperty("--viventory-welcome-footer", palette.welcomeFooter);
    root.style.setProperty("--viventory-shell-start", palette.shellStart);
    root.style.setProperty("--viventory-shell-mid", palette.shellMid);
    root.style.setProperty("--viventory-shell-end", palette.shellEnd);
    root.style.setProperty("--viventory-shell-text", palette.shellText);
    root.style.setProperty("--viventory-tab-active-border", palette.tabActiveBorder);
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
