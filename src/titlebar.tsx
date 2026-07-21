import "./titlestyle.css";
import { BsArrowsFullscreen, BsGearFill } from "react-icons/bs";
import { Tab } from "./types";
import Settings from "./components/Settings/Settings";
import { useEffect, useState } from "react";
import { platform } from "@tauri-apps/plugin-os";

type Props = {
    tabs: Tab[];
    setTabIndex: any;
    handleNewTab: () => number;
    setTab: (index: number, tab: Tab) => void;
    onToggleFullscreen: () => void;
};

export default function Titlebar({
                                     tabs,
                                     setTabIndex,
                                     handleNewTab,
                                     setTab,
                                     onToggleFullscreen,
                                 }: Props) {
    const [leftPadding, setLeftPadding] = useState(0);

    useEffect(() => {
        async function getOS() {
            const osName = await platform();
            setLeftPadding(osName === "macos" ? 85 : 0);
        }

        getOS();
    }, []);

    return (
        <div
            data-tauri-drag-region
            className="title"
            style={{ userSelect: "none" }}
        >
            <h3
                data-tauri-drag-region
                className="title-text"
                style={{
                    paddingLeft: `${leftPadding}px`,
                    fontSize: "15px",
                    margin: 0,
                    pointerEvents: "none"
                }}
            >
                VIVITA Maker Guide
            </h3>

            <div className="title-right">
                <button
                    title="fullscreen"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--viventory-surface)",
                        color: "var(--viventory-text)",
                        borderRadius: "6px",
                        border: "1px solid var(--viventory-border)",
                        padding: "7px",
                        cursor: "pointer",
                        boxShadow: "0 8px 18px rgba(36, 38, 43, 0.08)",
                    }}
                    onClick={onToggleFullscreen}
                >
                    <BsArrowsFullscreen size={18} color="currentColor" />
                </button>

                <button
                    title="settings"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--viventory-surface)",
                        color: "var(--viventory-text)",
                        borderRadius: "6px",
                        border: "1px solid var(--viventory-border)",
                        padding: "7px",
                        cursor: "pointer",
                        boxShadow: "0 8px 18px rgba(36, 38, 43, 0.08)",
                    }}
                    onClick={() => {
                        const existingIndex = tabs.findIndex(
                            (tab) => tab.name === "Settings"
                        );
                        if (existingIndex !== -1) {
                            setTabIndex(existingIndex);
                        } else {
                            const newIndex = handleNewTab();
                            setTab(newIndex, new Settings());
                        }
                    }}
                >
                    <BsGearFill size={18} color="currentColor" />
                </button>
            </div>
        </div>
    );
}
