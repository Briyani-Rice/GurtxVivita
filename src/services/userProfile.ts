import { UserPerms } from "../types";

export type FirebaseUserProfile = {
    uid: string;
    email: string | null;
    username: string;
    perms: UserPerms;
};

// Staff comes from the email allowlist (fallbackPerms) alone. The stored perms
// field is deliberately ignored: a signed-in user owns their own user/{uid}
// document, so honouring it meant anyone could write perms: "staff" once and
// return as an admin. firestore.rules now also refuses a staff value from a
// non-staff account, so the two layers agree.
export function buildUserProfile(
    input: { uid: string; email: string | null; displayName: string | null },
    existing: { username?: unknown; perms?: unknown },
    fallbackPerms: UserPerms,
): FirebaseUserProfile {
    return {
        uid: input.uid,
        email: input.email,
        username: String(existing.username ?? input.displayName ?? input.email ?? "Google user"),
        perms: fallbackPerms === UserPerms.Staff ? UserPerms.Staff : UserPerms.Basic,
    };
}
