import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { UserPerms } from "../types";
import { getFirebaseApp, getFirebaseFirestore } from "./firebaseApp";

export const USER_COLLECTION = "user";

export type FirebaseUserProfile = {
    uid: string;
    email: string | null;
    username: string;
    perms: UserPerms;
};

function permsFromValue(value: unknown): UserPerms {
    if (value === UserPerms.Staff || value === "staff" || value === "admin") {
        return UserPerms.Staff;
    }

    return UserPerms.Basic;
}

export async function getOrCreateFirebaseUserProfile(
    user: FirebaseUser,
    fallbackPerms: UserPerms,
): Promise<FirebaseUserProfile> {
    const app = getFirebaseApp();

    if (!app) {
        return {
            uid: user.uid,
            email: user.email,
            username: user.displayName || user.email || "Google user",
            perms: fallbackPerms,
        };
    }

    const db = getFirebaseFirestore();
    const ref = doc(db, USER_COLLECTION, user.uid);
    const snapshot = await getDoc(ref);
    const existing = snapshot.exists() ? snapshot.data() : {};
    const profile: FirebaseUserProfile = {
        uid: user.uid,
        email: user.email,
        username: String(existing.username ?? user.displayName ?? user.email ?? "Google user"),
        perms: fallbackPerms === UserPerms.Staff
            ? UserPerms.Staff
            : permsFromValue(existing.perms),
    };

    await setDoc(ref, {
        uid: profile.uid,
        email: profile.email,
        username: profile.username,
        perms: profile.perms === UserPerms.Staff ? "staff" : "basic",
        updatedAt: serverTimestamp(),
        ...(!snapshot.exists() ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true });

    return profile;
}
