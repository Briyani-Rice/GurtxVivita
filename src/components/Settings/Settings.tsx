import { Tab } from "../../types";
import React, {
    ReactElement,
    useEffect,
    useState
} from "react";
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

function SettingsContent() {
    const [pages, setPages] = useState<SettingsPage[]>([]);
    const [selectedIndex, setSelectedIndex] =
        useState<number>(0);
    const { language, t } = useI18n();

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
                flexDirection: "row",
                gap: "20px",
                padding: "20px",
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
                    width: "280px",
                    borderRight: "1px solid var(--viventory-border)",
                    paddingRight: "18px"
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
                        fontSize: "34px",
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
                        minHeight: "42px",
                        borderRadius: "6px",
                        padding: "0 14px",
                        background: "var(--viventory-surface)",
                        color: "var(--viventory-text)",
                        border: "1px solid var(--viventory-border)",
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                    }}
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
                                    padding: "12px 14px",
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
                    padding: "8px 0 0",
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
