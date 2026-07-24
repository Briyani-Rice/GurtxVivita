import { UserPerms } from "../types";

export type FirebaseUserProfile = {
    uid: string;
    email: string | null;
    username: string;
    perms: UserPerms;
};

export function permsFromValue(value: unknown): UserPerms {
    if (value === UserPerms.Staff || value === "staff" || value === "admin") {
        return UserPerms.Staff;
    }

    return UserPerms.Basic;
}

export function buildUserProfile(
    input: { uid: string; email: string | null; displayName: string | null },
    existing: { username?: unknown; perms?: unknown },
    fallbackPerms: UserPerms,
): FirebaseUserProfile {
    return {
        uid: input.uid,
        email: input.email,
        username: String(existing.username ?? input.displayName ?? input.email ?? "Google user"),
        perms: fallbackPerms === UserPerms.Staff ? UserPerms.Staff : permsFromValue(existing.perms),
    };
}
