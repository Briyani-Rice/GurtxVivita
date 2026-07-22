import { useEffect, useState } from "react";
import { SettingsPage } from "../Settings";
import {
    ACCOUNT_SESSION_EVENT,
    clearCurrentAccount,
    loadAccountHistory,
    loadCurrentAccount,
    type AccountRecord,
} from "../../../services/accountSession";
import { signOutOfFirebase } from "../../../services/firebaseAuth";
import { UserPerms } from "../../../types";

function permissionLabel(perms?: UserPerms): string {
    return perms === UserPerms.Staff ? "Admin" : "Member";
}

function providerLabel(account: AccountRecord): string {
    return account.provider === "google" ? "Google" : "Demo";
}

function formatLoginTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";

    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function AccountContent() {
    const [currentAccount, setCurrentAccount] = useState<AccountRecord | null>(() => loadCurrentAccount());
    const [history, setHistory] = useState<AccountRecord[]>(() => loadAccountHistory());
    const [busy, setBusy] = useState(false);

    const refresh = () => {
        setCurrentAccount(loadCurrentAccount());
        setHistory(loadAccountHistory());
    };

    useEffect(() => {
        window.addEventListener(ACCOUNT_SESSION_EVENT, refresh);
        window.addEventListener("storage", refresh);

        return () => {
            window.removeEventListener(ACCOUNT_SESSION_EVENT, refresh);
            window.removeEventListener("storage", refresh);
        };
    }, []);

    const openLogin = () => {
        window.dispatchEvent(new CustomEvent("viventory:open-login"));
    };

    const logout = async () => {
        setBusy(true);
        try {
            await signOutOfFirebase();
            clearCurrentAccount();
            refresh();
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(320px, 520px) minmax(260px, 360px)",
                gap: 22,
                color: "var(--viventory-text)",
            }}
        >
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
                <p style={{ margin: "0 0 8px", color: "var(--viventory-welcome-accent)", fontSize: 13, fontWeight: 850, textTransform: "uppercase" }}>
                    Account
                </p>
                <h3 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 850, letterSpacing: 0 }}>
                    Current account
                </h3>
                <p style={{ margin: "0 0 22px", color: "var(--viventory-muted-text)", fontSize: 17, lineHeight: 1.45 }}>
                    Sign in to route to the right workspace and keep a short list of accounts used on this device.
                </p>

                {currentAccount ? (
                    <div
                        style={{
                            border: "1px solid var(--viventory-border)",
                            borderRadius: 8,
                            background: "var(--viventory-surface)",
                            padding: 18,
                            display: "grid",
                            gap: 8,
                        }}
                    >
                        <strong style={{ fontSize: 20 }}>{currentAccount.label}</strong>
                        {currentAccount.email && (
                            <span style={{ color: "var(--viventory-muted-text)" }}>{currentAccount.email}</span>
                        )}
                        <span style={{ color: "var(--viventory-muted-text)" }}>
                            {providerLabel(currentAccount)} account · {permissionLabel(currentAccount.perms)} · Last used {formatLoginTime(currentAccount.lastLoginAt)}
                        </span>
                    </div>
                ) : (
                    <div
                        style={{
                            border: "1px dashed var(--viventory-border)",
                            borderRadius: 8,
                            padding: 18,
                            color: "var(--viventory-muted-text)",
                            background: "var(--viventory-surface)",
                        }}
                    >
                        No account is currently signed in.
                    </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                    <button
                        type="button"
                        onClick={openLogin}
                        style={{
                            border: "none",
                            borderRadius: 6,
                            background: "var(--viventory-welcome-accent)",
                            color: "#1f1300",
                            padding: "10px 14px",
                            cursor: "pointer",
                            fontWeight: 850,
                        }}
                    >
                        {currentAccount ? "Switch account" : "Log in"}
                    </button>
                    <button
                        type="button"
                        onClick={logout}
                        disabled={!currentAccount || busy}
                        style={{
                            border: "1px solid var(--viventory-border)",
                            borderRadius: 6,
                            background: "var(--viventory-surface)",
                            color: "var(--viventory-text)",
                            padding: "10px 14px",
                            cursor: currentAccount && !busy ? "pointer" : "not-allowed",
                            opacity: currentAccount && !busy ? 1 : 0.55,
                            fontWeight: 750,
                        }}
                    >
                        {busy ? "Logging out..." : "Log out"}
                    </button>
                </div>
            </section>

            <aside
                style={{
                    border: "1px solid var(--viventory-border)",
                    borderRadius: 8,
                    background: "var(--viventory-surface)",
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                }}
            >
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 850 }}>Previous accounts</h3>
                {history.length > 0 ? history.map(account => (
                    <button
                        key={account.id}
                        type="button"
                        onClick={openLogin}
                        style={{
                            border: "1px solid var(--viventory-border)",
                            borderRadius: 6,
                            background: currentAccount?.id === account.id
                                ? "var(--viventory-active-tab)"
                                : "var(--viventory-welcome-card)",
                            color: "var(--viventory-text)",
                            padding: 12,
                            textAlign: "left",
                            cursor: "pointer",
                        }}
                    >
                        <strong>{account.label}</strong>
                        <div style={{ marginTop: 4, color: "var(--viventory-muted-text)", fontSize: 13 }}>
                            {providerLabel(account)} · {formatLoginTime(account.lastLoginAt)}
                        </div>
                    </button>
                )) : (
                    <p style={{ margin: 0, color: "var(--viventory-muted-text)", lineHeight: 1.45 }}>
                        Accounts you use here will appear after your first login.
                    </p>
                )}
            </aside>
        </div>
    );
}

const Account: SettingsPage = {
    name: "Account",

    content: <AccountContent />,

    save: () => {
        return {};
    },
};

export default Account;
