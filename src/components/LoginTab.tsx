import { Tab, User, UserPerms } from "../types";
import {BasicTabProps} from "../app";
import React, {useEffect, useState} from "react";
import { Eye, EyeClosed } from "lucide-react";
import AdminViewTab from "./AdminViewTab";
import { UserViewTab } from "./UserViewTab";
import {
    isFirebaseAuthConfigured,
    isGoogleLoginSupported,
    signInWithGoogle,
    type FirebaseLoginResult,
} from "../services/firebaseAuth";
import { recordAccountLogin } from "../services/accountSession";
import { isProgressNote } from "../services/googleAuthErrors";
import { useI18n } from "../i18n/i18n";

type LoginTabContentProps = BasicTabProps & {
    actL: number;
    loginTabId: string;
};

export default class LoginTab implements Tab {
    content: React.ReactNode;
    id: string = crypto.randomUUID();
    name: string = "Login";

    constructor(props: BasicTabProps, actL: number) {
        this.content = (
            <LoginTabContent {...props} actL={actL} loginTabId={this.id} />
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
                             loginTabId,
                         }: LoginTabContentProps) {
    const [showPass, setShowPass] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [note, setNote] = useState("");
    const [noteIsSuccess, setNoteIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    // Tauri injects its runtime globals during webview startup, and they may not
    // be present at this first synchronous render. Reading the flags once here
    // used to leave the Google button stuck on whichever value won that startup
    // race — "Sign in with Google" or "Configure desktop Google login" — from run
    // to run. Seed from the current value, then re-check after mount (when the
    // runtime is reliably detectable) so the label settles deterministically.
    const [firebaseConfigured, setFirebaseConfigured] = useState(isFirebaseAuthConfigured);
    const [googleLoginSupported, setGoogleLoginSupported] = useState(isGoogleLoginSupported);
    const { t } = useI18n();

    useEffect(() => {
        setFirebaseConfigured(isFirebaseAuthConfigured());
        setGoogleLoginSupported(isGoogleLoginSupported());
    }, []);

    const completeLogin = (
        res: { perms?: UserPerms; email?: string | null; displayName?: string | null },
        localUser?: User | null,
    ) => {
        const isAdmin = res?.perms === UserPerms.Staff || localUser?.getPerms() === UserPerms.Staff;

        if (localUser) {
            recordAccountLogin({
                label: localUser.getUsername(),
                provider: "demo",
                perms: localUser.getPerms(),
            });
        } else {
            recordAccountLogin({
                label: res.displayName || res.email || "Google account",
                email: res.email,
                provider: "google",
                perms: res.perms,
            });
        }

        setNote(t("login.success"));
        setNoteIsSuccess(true);
        setTabs((prevTabs) => {
            const tabsWithoutLogin = prevTabs.filter((tab) => tab.id !== loginTabId);
            const targetName = isAdmin ? "Admin View" : "User View";
            const existingIndex = tabsWithoutLogin.findIndex(tab => tab.name === targetName);

            if (existingIndex !== -1) {
                setTabIndex(existingIndex);
                return tabsWithoutLogin;
            }

            const nextTab = isAdmin ? new AdminViewTab() : new UserViewTab();
            setTabIndex(tabsWithoutLogin.length);
            return [...tabsWithoutLogin, nextTab];
        });
    };

    const handleLogin = async () => {
        try {
            setLoading(true);
            setNote("");
            setNoteIsSuccess(false);

            const localUser = User.login(username.trim(), password);

            // @ts-ignore
            const res = window.user?.signIn
                // @ts-ignore
                ? await window.user.signIn({
                    username: username.trim(),
                    password,
                })
                : localUser
                    ? {
                        success: true,
                        note: "Welcome back!",
                        perms: localUser.getPerms(),
                    }
                    : {
                        success: false,
                        note: t("login.invalid"),
                    };

            if (!res?.success) {
                setNote(res?.note ?? "Login failed.");
                return;
            }

            completeLogin(res, localUser);

        } catch (err) {
            console.error(err);
            setNote(t("login.error"));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            setNote("");
            setNoteIsSuccess(false);

            const res: FirebaseLoginResult = await signInWithGoogle();

            if (!res.success) {
                // A redirect that is under way is progress, not an error, so it
                // should not be shown in red.
                setNote(res.note);
                setNoteIsSuccess(isProgressNote(res));
                return;
            }

            completeLogin(res);
        } catch (err) {
            console.error(err);
            setNote(err instanceof Error ? `Google login failed: ${err.message}` : "Google login failed.");
        } finally {
            setGoogleLoading(false);
        }
    };

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
                    {t("login.title")}
                </h1>
                <p style={{ marginTop: "-12px", marginBottom: "24px", color: "#555" }}>
                    {t("login.demo")}
                </p>

                {/* Username */}
                <div style={{ marginBottom: "16px", color:"black" }}>
                    <label htmlFor="username">{t("login.username")}</label>
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
                            color:"black"
                        }}
                    />
                </div>

                {/* Password */}
                <div style={{ marginBottom: "16px",color:"black" }}>
                    <label htmlFor="password">{t("login.password")}</label>
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
                                color:"black"
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
                    {loading ? t("login.loggingIn") : t("login.button")}
                </button>

                <button
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading || !googleLoginSupported}
                    title={
                        googleLoginSupported
                            ? "Sign in with Google"
                            : firebaseConfigured
                                ? "Set VITE_GOOGLE_DESKTOP_CLIENT_ID and VITE_GOOGLE_DESKTOP_CLIENT_SECRET in .env to enable Google login in the desktop app"
                            : "Add Firebase Vite environment variables to enable Google login"
                    }
                    style={{
                        width: "100%",
                        marginTop: "10px",
                        padding: "10px",
                        cursor: googleLoginSupported ? "pointer" : "not-allowed",
                        border: "1px solid #ddd",
                        background: "#fff",
                        color: "black",
                        opacity: googleLoginSupported ? 1 : 0.65,
                    }}
                >
                    {googleLoading
                        ? t("login.googleOpening")
                        : googleLoginSupported
                            ? t("login.google")
                            : firebaseConfigured
                                ? t("login.googleConfigureDesktop")
                                : t("login.googleConfigure")}
                </button>

                {/* Status */}
                {note && (
                    <p
                        style={{
                            marginTop: "12px",
                            color: noteIsSuccess ? "green" : "red",
                        }}
                    >
                        {note}
                    </p>
                )}
            </div>
        </div>
    );
}
