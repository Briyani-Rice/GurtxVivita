import { Tab } from "../../types";
import React, {
    ReactElement,
    useEffect,
    useMemo,
    useState
} from "react";
import { platform } from "@tauri-apps/plugin-os";
import { translateSettingsPageName, useI18n } from "../../i18n/i18n";

async function getPages(): Promise<SettingsPage[]> {
    //@ts-ignore
    const modules = import.meta.glob(
        "./SettingsPages/*.tsx"
    );

    const pages: SettingsPage[] = [];

    for (const path in modules) {
        const module: any = await modules[path]();

        if (module.default) {
            pages.push(module.default);
        }
    }

    return pages;
}

function isMobilePlatform(): boolean {
    try {
        const p = platform();
        return p === "android" || p === "ios";
    } catch {
        // platform() throws outside a Tauri context (e.g. web preview)
        return false;
    }
}

function SettingsContent() {
    const [pages, setPages] = useState<SettingsPage[]>([]);
    const [selectedIndex, setSelectedIndex] =
        useState<number>(0);
    const { language, t } = useI18n();
    const isMobile = useMemo(() => isMobilePlatform(), []);

    useEffect(() => {
        loadPages();
    }, []);

    async function loadPages() {
        const loadedPages = await getPages();
        setPages(loadedPages);
    }

    // @ts-ignore
    return (
        <div
            style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? "14px" : "20px",
                padding: isMobile ? "14px" : "20px",
                minHeight: "100%",
                boxSizing: "border-box",
                background: "var(--viventory-welcome-bg)",
                color: "var(--viventory-text)",
                fontSize: "var(--viventory-font-size)",
            }}
        >
            {/* Sidebar */}
            <div
                style={{
                    width: isMobile ? "100%" : "280px",
                    flexShrink: 0,
                    borderRight: isMobile ? "none" : "1px solid var(--viventory-border)",
                    borderBottom: isMobile ? "1px solid var(--viventory-border)" : "none",
                    paddingRight: isMobile ? 0 : "18px",
                    paddingBottom: isMobile ? "14px" : 0,
                }}
            >
                <p
                    style={{
                        margin: "0 0 8px",
                        color: "var(--viventory-welcome-accent)",
                        fontSize: "13px",
                        fontWeight: 850,
                        textTransform: "uppercase",
                        letterSpacing: 0,
                    }}
                >
                    {t("settings.controlRoom")}
                </p>
                <h2
                    style={{
                        margin: "0 0 16px",
                        fontSize: isMobile ? "26px" : "34px",
                        fontWeight: 850,
                        letterSpacing: 0,
                        color: "var(--viventory-text)",
                    }}
                >
                    {t("settings.title")}
                </h2>


                <input
                    type="search"
                    placeholder={t("settings.searchPlaceholder")}
                    style={{
                        width: "100%",
                        marginBottom: "14px",
                        minHeight: isMobile ? "44px" : "42px",
                        borderRadius: "6px",
                        padding: "0 14px",
                        background: "var(--viventory-surface)",
                        color: "var(--viventory-text)",
                        border: "1px solid var(--viventory-border)",
                        boxSizing: "border-box",
                    }}
                />

                <div
                    style={
                        isMobile
                            ? {
                                display: "flex",
                                flexDirection: "row",
                                gap: "8px",
                                overflowX: "auto",
                                paddingBottom: "4px",
                                WebkitOverflowScrolling: "touch",
                            }
                            : {
                                display: "flex",
                                flexDirection: "column",
                                gap: "5px",
                            }
                    }
                >
                    {
                        pages.map((page, index) => (
                            <button
                                key={index}
                                onClick={() =>
                                    setSelectedIndex(index)
                                }
                                style={{
                                    textAlign: "left",
                                    padding: isMobile ? "10px 14px" : "12px 14px",
                                    borderRadius: "8px",
                                    border:
                                        index === selectedIndex
                                            ? "2px solid var(--viventory-tab-active-border)"
                                            : "1px solid var(--viventory-border)",
                                    background:
                                        index === selectedIndex
                                            ? "var(--viventory-active-tab)"
                                            : "var(--viventory-surface)",
                                    color: "var(--viventory-text)",
                                    cursor: "pointer",
                                    fontWeight: 750,
                                    whiteSpace: isMobile ? "nowrap" : "normal",
                                    flexShrink: isMobile ? 0 : undefined,
                                }}
                            >
                                {translateSettingsPageName(language, page.name)}
                            </button>
                        ))
                    }
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    padding: isMobile ? "4px 0 0" : "8px 0 0",
                }}
            >
                {
                    pages.length > 0
                        ? pages[selectedIndex]?.content
                        : <p>Loading settings...</p>
                }
            </div>
        </div>
    );
}

export default class Settings implements Tab {
    id = crypto.randomUUID()

    name: string = "Settings";

    content: React.ReactNode;

    constructor() {
        this.content = <SettingsContent />;
    }
}

export interface SettingsPage {
    name: string;

    content: ReactElement;

    save: () => {};
}