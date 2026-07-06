import "./titlestyle.css";
import { BsGearFill } from "react-icons/bs";
import { Tab } from "./types";
import Settings from "./components/Settings/Settings";
import { Button } from "./components/ui/button";
import { useEffect, useState } from "react";
import { platform } from "@tauri-apps/plugin-os";

type Props = {
    tabs: Tab[];
    setTabIndex: any;
    handleNewTab: () => number;
    setTab: (index: number, tab: Tab) => void;
    setCmdBarVis: (b: boolean) => void;
};

export default function Titlebar({
                                     tabs,
                                     setTabIndex,
                                     handleNewTab,
                                     setTab,
                                     setCmdBarVis,
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
        <div className="title">
            <h3
                className="title-text"
                style={{
                    paddingLeft: `${leftPadding}px`,
                    fontSize: "15px",
                }}
            >
                VIVITA Maker Guide
            </h3>

            <div className="title-main">
                <Button
                    className="command-button"
                    onClick={() => setCmdBarVis(true)}
                >
                    &gt; Enter command
                </Button>
            </div>

            <div className="title-right">
                <button
                    title="settings"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.14)",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.22)",
                        padding: "7px",
                        cursor: "pointer",
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
