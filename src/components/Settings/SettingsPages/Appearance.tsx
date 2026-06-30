import { useEffect, useMemo, useRef, useState } from "react";
import { SettingsPage } from "../Settings";
import { Language } from "../../../types";

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
                    background: "#1f1f1f",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    color: "white",
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
                        background: "#1f1f1f",
                        border: "1px solid #333",
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
                            background: "#151515",
                            border: "none",
                            borderBottom: "1px solid #333",
                            color: "white",
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
                                        color: value === opt.value ? "#3498db" : "#bbb",
                                        background: value === opt.value ? "#252525" : "transparent",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#252525")}
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = value === opt.value ? "#252525" : "transparent")
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

function AppearanceContent() {
    const [active, setActive] = useState("light");
    const [fontSize,setFontSize] = useState<number>(14);
    const [language,setLanguage] = useState<Language>(Language.English);

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
            display:"flex",
            flexDirection:"column",
            gap:"10px",
        }}>
            <h3>Appearance</h3>
            <p>Customize the app's appearance</p>
            <label style={{
                width:"100%",
                display:"flex",
                flexDirection:"row",
                gap:"50px",
                alignItems:"center",
            }}>
                <p>Theme</p>
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        width: "220px",
                        padding: "6px",
                        background: "#1f1f1f",
                        borderRadius: "999px",
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
                            background: "white",
                            borderRadius: "999px",
                            transition: "transform 0.3s ease",
                            transform: `translateX(${getTranslate()})`,
                        }}
                    />

                    {["light", "system", "dark"].map((mode) => (
                        <div
                            key={mode}
                            onClick={() => setActive(mode)}
                            style={{
                                flex: 1,
                                padding: "3px 0",
                                textAlign: "center",
                                cursor: "pointer",
                                zIndex: 2,
                                fontSize: "14px",
                                fontWeight: 600,
                                color: active === mode ? "black" : "#bbb",
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
                <p>Font size</p>
                <input type="number" min="8" max="64" value={
                    fontSize.toString()
                } onChange={(e)=>{
                    setFontSize(Number(e.target.value));
                }}
                style={{
                    width:"50px",
                    borderRadius:"25px",
                    padding: "3px 0",
                    textAlign: "center",
                    cursor: "pointer",
                    zIndex: 2,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "white",
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
                <p>Language</p>
                <SearchableDropdown 
                    enumObject={Language}
                    value={language} 
                    onSelect={setLanguage} 
                />
            </label>
            <label style={{
                display:"flex",
                flexDirection:"row",
                gap:"36px",
                alignItems:"center",
            }}>
                <p>Vertical tabs</p>
                <input type="checkbox"/>
            </label>
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