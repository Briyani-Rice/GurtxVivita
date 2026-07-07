import { useEffect, useMemo, useRef, useState } from "react";
import { SettingsPage } from "../Settings";
import { Language } from "../../../types";
import {
    AppearanceTheme,
    applyAppearancePrefs,
    loadAppearancePrefs,
    saveAppearancePrefs,
} from "../appearancePreferences";

interface SearchableDropdownProps {
    enumObject: Record<string, string | number>;
    value: string | number;
    onSelect: (value: Language) => void;
}

export function SearchableDropdown({ enumObject, value, onSelect }: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const options = useMemo(() => {
        return Object.entries(enumObject).map(([key, val]) => ({
            label: val.toString(),
            value: val
        }));
    }, [enumObject]);

    const currentLabel = options.find(opt => opt.value === value)?.label || "Select...";

    const filteredOptions = useMemo(() => {
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [options, searchQuery]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (
        <div ref={dropdownRef} style={{ position: "relative", width: "160px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
            {/* Target Select Button */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSearchQuery("");
                }}
                style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--viventory-control)",
                    border: "1px solid var(--viventory-border)",
                    borderRadius: "6px",
                    color: "var(--viventory-control-text)",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px",
                    boxSizing: "border-box" // Added for unified layout rendering
                }}
            >
                {currentLabel}
            </button>

            {/* Hidden Floating Menu */}
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "105%",
                        left: 0,
                        width: "100%",
                        background: "var(--viventory-control)",
                        border: "1px solid var(--viventory-border)",
                        borderRadius: "6px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                        zIndex: 10,
                        overflow: "hidden",
                        boxSizing: "border-box" // Crucial fix: Keeps container boundaries constrained
                    }}
                >
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        style={{
                            width: "100%",
                            padding: "8px",
                            background: "var(--viventory-muted-surface)",
                            border: "none",
                            borderBottom: "1px solid var(--viventory-border)",
                            color: "var(--viventory-text)",
                            fontSize: "13px",
                            outline: "none",
                            boxSizing: "border-box"
                        }}
                    />
                    <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value.toString()} // Ensure keys are strings
                                    onClick={() => {
                                        onSelect(opt.value as Language);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        padding: "8px 12px",
                                        fontSize: "13px",
                                        color: value === opt.value ? "#2f80ed" : "var(--viventory-control-text)",
                                        background: value === opt.value ? "var(--viventory-muted-surface)" : "transparent",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--viventory-muted-surface)")}
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = value === opt.value ? "var(--viventory-muted-surface)" : "transparent")
                                    }
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                          <div style={{ padding: "8px 12px", fontSize: "13px", color: "#666", textAlign: "center" }}>
                              No results
                          </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const COPY: Record<Language, {
    title: string;
    subtitle: string;
    theme: string;
    fontSize: string;
    language: string;
}> = {
    [Language.English]: {
        title: "Appearance",
        subtitle: "Make the app feel right for the workshop",
        theme: "Theme",
        fontSize: "Font size",
        language: "Language",
    },
    [Language.Chinese]: {
        title: "外观",
        subtitle: "自定义应用外观",
        theme: "主题",
        fontSize: "字体大小",
        language: "语言",
    },
    [Language.Japanese]: {
        title: "外観",
        subtitle: "アプリの外観を変更します",
        theme: "テーマ",
        fontSize: "フォントサイズ",
        language: "言語",
    },
    [Language.Malay]: {
        title: "Paparan",
        subtitle: "Sesuaikan rupa aplikasi",
        theme: "Tema",
        fontSize: "Saiz fon",
        language: "Bahasa",
    },
    [Language.Tamil]: {
        title: "தோற்றம்",
        subtitle: "செயலியின் தோற்றத்தை மாற்றவும்",
        theme: "தீம்",
        fontSize: "எழுத்தளவு",
        language: "மொழி",
    },
};

function AppearanceContent() {
    const [prefs, setPrefs] = useState(() => loadAppearancePrefs());
    const { theme: active, fontSize, language } = prefs;
    const copy = COPY[language] ?? COPY[Language.English];

    const updatePrefs = (nextPrefs: typeof prefs) => {
        const saved = saveAppearancePrefs(nextPrefs);
        applyAppearancePrefs(saved);
        setPrefs(saved);
    };

    const getTranslate = () => {
        switch (active) {
            case "system":
                return "100%";
            case "dark":
                return "200%";
            default:
                return "0%";
        }
    };

    return (
        <div
        style={{
            display:"grid",
            gridTemplateColumns: "minmax(320px, 520px) minmax(260px, 360px)",
            gap:"22px",
            color: "var(--viventory-text)",
        }}>
            <section
                style={{
                    border: "1px solid var(--viventory-border)",
                    borderRadius: 8,
                    background: "var(--viventory-welcome-card)",
                    padding: 24,
                    boxShadow: "0 18px 42px rgba(15, 23, 42, 0.12)",
                    backdropFilter: "blur(14px)",
                }}
            >
            <h3 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 850, letterSpacing: 0 }}>
                {copy.title}
            </h3>
            <p style={{ margin: "0 0 22px", color: "var(--viventory-muted-text)", fontSize: 17 }}>
                {copy.subtitle}
            </p>
            <label style={{
                width:"100%",
                display:"flex",
                flexDirection:"row",
                gap:"50px",
                alignItems:"center",
            }}>
                <p style={{ color: "var(--viventory-text)" }}>{copy.theme}</p>
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        width: "220px",
                        padding: "6px",
                        background: "var(--viventory-control)",
                        borderRadius: "6px",
                        fontFamily: "Arial, sans-serif",
                        userSelect: "none",
                        aspectRatio:"7"
                    }}
                >
                    {/* Sliding background */}
                    <div
                        style={{
                            position: "absolute",
                            top: "5px",
                            left: "6px",
                            width: "calc((100% - 12px) / 3)",
                            height: "calc(100% - 12px)",
                            background: "var(--viventory-welcome-accent)",
                            borderRadius: "4px",
                            transition: "transform 0.3s ease",
                            transform: `translateX(${getTranslate()})`,
                        }}
                    />

                    {(["light", "system", "dark"] as AppearanceTheme[]).map((mode) => (
                        <div
                            key={mode}
                            onClick={() => updatePrefs({ ...prefs, theme: mode })}
                            style={{
                                flex: 1,
                                padding: "3px 0",
                                textAlign: "center",
                                cursor: "pointer",
                                zIndex: 2,
                                fontSize: "14px",
                                fontWeight: 600,
                                color: active === mode ? "#1f1300" : "var(--viventory-muted-text)",
                                textTransform: "capitalize",
                            }}
                        >
                            {mode}
                        </div>
                    ))}
                </div>
            </label>
            <label style={{
                display:"flex",
                flexDirection:"row",
                gap:"36px",
                alignItems:"center",
            }}>
                <p style={{ color: "var(--viventory-text)" }}>{copy.fontSize}</p>
                <input type="number" min="8" max="64" value={
                    fontSize.toString()
                } onChange={(e)=>{
                    updatePrefs({ ...prefs, fontSize: Number(e.target.value) });
                }}
                style={{
                    width:"50px",
                    borderRadius:"4px",
                    padding: "3px 0",
                    textAlign: "center",
                    cursor: "pointer",
                    zIndex: 2,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--viventory-control-text)",
                    background: "var(--viventory-control)",
                    textTransform: "capitalize",
                    aspectRatio:"2"
                }}/>
            </label>
            <label style={{
                display:"flex",
                flexDirection:"row",
                gap:"36px",
                alignItems:"center",
            }}>
                <p style={{ color: "var(--viventory-text)" }}>{copy.language}</p>
                <SearchableDropdown 
                    enumObject={Language}
                    value={language} 
                    onSelect={(nextLanguage) => updatePrefs({ ...prefs, language: nextLanguage })}
                />
            </label>
            </section>
            <aside
                style={{
                    borderRadius: 8,
                    padding: 22,
                    background: "linear-gradient(135deg, var(--viventory-welcome-accent), var(--viventory-welcome-accent-2))",
                    color: "#1f1300",
                    minHeight: 220,
                    boxShadow: "0 18px 42px rgba(180, 83, 9, 0.22)",
                }}
            >
                <p style={{ margin: 0, fontSize: 13, fontWeight: 850, textTransform: "uppercase" }}>
                    Preview card
                </p>
                <h3 style={{ margin: "18px 0 10px", fontSize: 28, letterSpacing: 0 }}>
                    VIVITA Maker Guide
                </h3>
                <p style={{ margin: 0, color: "#1f1300", lineHeight: 1.45 }}>
                    Theme, font size, and language changes apply immediately across the workspace.
                </p>
            </aside>
        </div>
    );
}

const Appearance: SettingsPage = {
    name: "Appearance",

    content: <AppearanceContent />,

    save: () => {
        return {};
    },
};

export default Appearance;
