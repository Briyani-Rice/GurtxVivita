import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { UserPerms } from "../types";
import { getFirebaseApp, getFirebaseFirestore } from "./firebaseApp";
import { buildUserProfile, type FirebaseUserProfile } from "./userProfile";
import { withTimeout } from "../utils/withTimeout";

export const USER_COLLECTION = "user";
export type { FirebaseUserProfile } from "./userProfile";

// Firestore has no built-in deadline: if the backend is unreachable (offline,
// blocked, or the database is not provisioned), getDoc/setDoc can pend forever.
// That would hang the login spinner indefinitely, so we give the best-effort
// profile write a hard ceiling and let sign-in proceed on the computed perms.
const PROFILE_PERSIST_TIMEOUT_MS = 8000;

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
    // perms we computed. A profile-write failure — or a hang — must never fail or
    // stall the whole login.
    const persist = async (): Promise<FirebaseUserProfile> => {
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
    };

    try {
        return await withTimeout(
            persist(),
            PROFILE_PERSIST_TIMEOUT_MS,
            () => {
                console.warn("User profile persistence timed out; continuing with computed perms.");
                return buildUserProfile(input, {}, fallbackPerms);
            },
        );
    } catch (error) {
        console.warn("User profile persistence failed; continuing with computed perms.", error);
        return buildUserProfile(input, {}, fallbackPerms);
    }
}
