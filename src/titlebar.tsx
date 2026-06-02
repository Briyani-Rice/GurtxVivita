// @ts-ignore
import "./titlestyle.css";
import { BsGearFill } from "react-icons/bs";
import {Tab} from "./types";
import Settings from "./components/Settings/Settings";
import {Button} from "./components/ui/button";
import {useState} from "react";

type Props = {
    tabs: Tab[];
    setTabIndex:any;
    handleNewTab: () => number;
    setTab: (index: number, tab: Tab) => void;
    setCmdBarVis: (b:boolean) => void;
};
export default function Titlebar({ tabs,setTabIndex, handleNewTab, setTab, setCmdBarVis}: Props){
    var leftPadding = 0;
    //@ts-ignore
    if (window.electron?.isMac != null) {
        //@ts-ignore
        leftPadding = window.electron.isMac ? 85 : 0;
    } else {
        console.error("Electron not detected!");
    }
    return (<div className="title">
        <h3
            className="title-text"
            style={{
                 paddingLeft: `${leftPadding}px`,
                 fontSize:`15px`
                }}
            
        >
            Viventory
        </h3>

        <div className="title-main">
            <Button style={{
                width:"100%",
                border:"none",
                borderRadius:"5px",
                fontFamily:"monospace",
                justifyContent:"left",
            }}
            onClick={
                ()=>{
                    setCmdBarVis(true)
                }
            }>
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
                    background: "transparent",
                    borderRadius: "5px",
                    border: "1.5px solid transparent",
                    padding: "5px",
                    cursor: "pointer",
                }}
                onClick={()=>{
                    const existingIndex = tabs.findIndex(tab => tab.name === "Settings");
                    if (existingIndex !== -1) {
                        setTabIndex(existingIndex);
                    } else {
                        const newIndex = handleNewTab();
                        setTab(newIndex, new Settings());
                    }
                }}
            >
                <BsGearFill size={18} color="black" />
            </button>
        </div>
    </div>)
}