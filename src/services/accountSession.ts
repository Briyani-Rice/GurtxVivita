import { UserPerms } from "../types";

export type AccountProvider = "demo" | "google";

export interface AccountRecord {
    id: string;
    label: string;
    email?: string | null;
    provider: AccountProvider;
    perms?: UserPerms;
    lastLoginAt: string;
}

export const CURRENT_ACCOUNT_KEY = "viventory_current_account";
export const ACCOUNT_HISTORY_KEY = "viventory_account_history";
export const ACCOUNT_SESSION_EVENT = "viventory:account-session-change";

function safeParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;

    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function accountId(provider: AccountProvider, label: string, email?: string | null): string {
    return `${provider}:${(email || label).trim().toLowerCase()}`;
}

function storageOrDefault(storage?: Storage): Storage {
    return storage ?? window.localStorage;
}

function broadcastAccountChange(): void {
    window.dispatchEvent(new CustomEvent(ACCOUNT_SESSION_EVENT));
}

export function loadCurrentAccount(storage?: Storage): AccountRecord | null {
    return safeParse<AccountRecord | null>(
        storageOrDefault(storage).getItem(CURRENT_ACCOUNT_KEY),
        null,
    );
}

export function loadAccountHistory(storage?: Storage): AccountRecord[] {
    const value = safeParse<AccountRecord[]>(
        storageOrDefault(storage).getItem(ACCOUNT_HISTORY_KEY),
        [],
    );

    return Array.isArray(value) ? value : [];
}

export function recordAccountLogin(
    account: Omit<AccountRecord, "id" | "lastLoginAt">,
    storage?: Storage,
): AccountRecord {
    const targetStorage = storageOrDefault(storage);
    const savedAccount: AccountRecord = {
        ...account,
        id: accountId(account.provider, account.label, account.email),
        lastLoginAt: new Date().toISOString(),
    };
    const history = [
        savedAccount,
        ...loadAccountHistory(targetStorage).filter(existing => existing.id !== savedAccount.id),
    ].slice(0, 5);

    targetStorage.setItem(CURRENT_ACCOUNT_KEY, JSON.stringify(savedAccount));
    targetStorage.setItem(ACCOUNT_HISTORY_KEY, JSON.stringify(history));
    broadcastAccountChange();

    return savedAccount;
}

export function clearCurrentAccount(storage?: Storage): void {
    storageOrDefault(storage).removeItem(CURRENT_ACCOUNT_KEY);
    broadcastAccountChange();
}
