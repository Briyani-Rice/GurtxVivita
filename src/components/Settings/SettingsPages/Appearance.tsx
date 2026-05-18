import { useState } from "react";
import { SettingsPage } from "../Settings";

function AppearanceContent() {
    const [active, setActive] = useState("light");

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
        <div>
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
                        width: "340px",
                        padding: "6px",
                        background: "#1f1f1f",
                        borderRadius: "999px",
                        fontFamily: "Arial, sans-serif",
                        userSelect: "none",
                    }}
                >
                    {/* Sliding background */}
                    <div
                        style={{
                            position: "absolute",
                            top: "6px",
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
                                padding: "12px 0",
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