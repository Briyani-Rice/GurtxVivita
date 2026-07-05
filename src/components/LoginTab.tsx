import { Tab } from "../types";
import {BasicTabProps} from "../app";
import React, {useEffect, useState} from "react";
import { Eye, EyeClosed } from "lucide-react";

type LoginTabContentProps = BasicTabProps & {
    actL: number;
};

export default class LoginTab implements Tab {
    content: React.ReactNode;
    id: string = crypto.randomUUID();
    name: string = "Login";

    constructor(props: BasicTabProps, actL: number) {
        this.content = (
            <LoginTabContent {...props} actL={actL} />
        );
    }
}

function LoginTabContent({
                             tabs,
                             setTabs,
                             tabIndex,
                             setTabIndex,
                             handleNewTab,
                             setTab,
                             handleClosingTab,
                             actL,
                         }: LoginTabContentProps) {
    const [showPass, setShowPass] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            setLoading(true);
            setNote("");

            // @ts-ignore
            const res = await window.user?.signIn({
                username,
                password,
            });

            if (!res?.success) {
                setNote(res?.note ?? "Login failed.");
                return;
            }

            setNote("Login successful!");
            handleClosingTab(actL);
            setTabIndex(0);

        } catch (err) {
            console.error(err);
            setNote("Unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const run = async () => {
            try {
                // @ts-ignore
                const usrname = await window.user?.getCUsrname();

                if (usrname != undefined) {
                    handleClosingTab(actL);
                    setTabIndex(0);
                }
            } catch (err) {
                console.error("Failed to get username:", err);
            }
        };

        run();
    }, []);

    return (
        <div
            style={{
                height: "100%",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#fff",
                backgroundImage:
                    "radial-gradient(gray 1px, transparent 1px)",
                backgroundSize: "16px 16px",
                padding: "20px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    minWidth: "350px",
                    padding: "32px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.95)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
            >
                <h1 style={{ marginBottom: "24px" }}>
                    Login to Viventory
                </h1>

                {/* Username */}
                <div style={{ marginBottom: "16px" }}>
                    <label htmlFor="username">Username</label>
                    <br />
                    <input
                        id="username"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        type="text"
                        style={{
                            width: "100%",
                            border: "none",
                            borderBottom: "1px solid black",
                            background: "transparent",
                            outline: "none",
                            fontFamily: "monospace",
                            padding: "4px 0",
                        }}
                    />
                </div>

                {/* Password */}
                <div style={{ marginBottom: "16px" }}>
                    <label htmlFor="password">Password</label>
                    <br />

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <input
                            id="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            type={showPass ? "text" : "password"}
                            style={{
                                flex: 1,
                                border: "none",
                                borderBottom: "1px solid black",
                                background: "transparent",
                                outline: "none",
                                fontFamily: "monospace",
                                padding: "4px 0",
                            }}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowPass((v) => !v)
                            }
                            style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                padding: 0,
                            }}
                        >
                            {showPass ? (
                                <Eye size={18} />
                            ) : (
                                <EyeClosed size={18} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Login button */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "10px",
                        cursor: "pointer",
                    }}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                {/* Status */}
                {note && (
                    <p
                        style={{
                            marginTop: "12px",
                            color: note.includes("successful")
                                ? "green"
                                : "red",
                        }}
                    >
                        {note}
                    </p>
                )}
            </div>
        </div>
    );
}