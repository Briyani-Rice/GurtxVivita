import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { UserPerms } from "../types";
import { getFirebaseApp, getFirebaseFirestore } from "./firebaseApp";
import { buildUserProfile, type FirebaseUserProfile } from "./userProfile";

export const USER_COLLECTION = "user";
export type { FirebaseUserProfile } from "./userProfile";

export async function getOrCreateFirebaseUserProfile(
    user: FirebaseUser,
    fallbackPerms: UserPerms,
): Promise<FirebaseUserProfile> {
    const input = { uid: user.uid, email: user.email, displayName: user.displayName };
    const app = getFirebaseApp();

    if (!app) {
        return buildUserProfile(input, {}, fallbackPerms);
    }

    // Persisting the profile is best-effort: if Firestore rules deny the write,
    // or the database is locked/unreachable, the user is still signed in with the
    // perms we computed. A profile-write failure must never fail the whole login.
    try {
        const db = getFirebaseFirestore();
        const ref = doc(db, USER_COLLECTION, user.uid);
        const snapshot = await getDoc(ref);
        const existing = snapshot.exists() ? snapshot.data() : {};
        const profile = buildUserProfile(input, existing, fallbackPerms);

        await setDoc(ref, {
            uid: profile.uid,
            email: profile.email,
            username: profile.username,
            perms: profile.perms === UserPerms.Staff ? "staff" : "basic",
            updatedAt: serverTimestamp(),
            ...(!snapshot.exists() ? { createdAt: serverTimestamp() } : {}),
        }, { merge: true });

        return profile;
    } catch (error) {
        console.warn("User profile persistence failed; continuing with computed perms.", error);
        return buildUserProfile(input, {}, fallbackPerms);
    }
}
