// @ts-ignore
import "./titlestyle.css";
import { BsGearFill } from "react-icons/bs";
export default function Titlebar(){
    var leftPadding = 0;
    if (window.electron?.isMac != null) {
        leftPadding = window.electron.isMac ? 85 : 0;
        console.log(window.electron.isMac);
    } else {
        console.error("Electron not detected!");
    }
    return (<div className="title">
        <h3
            className="title-text"
            style={{ paddingLeft: `${leftPadding}px` }}
        >
            Vivita materials app
        </h3>

        <div className="title-main">
            <input type="search" placeholder="Enter command..."/>
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
            >
                <BsGearFill size={18} color="black" />
            </button>
        </div>
    </div>)
}