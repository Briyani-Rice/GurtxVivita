import {
    getAuth,
    getRedirectResult,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    type Auth,
    type User as FirebaseUser,
} from "firebase/auth";
import { UserPerms } from "../types";
import { getFirebaseApp, hasFirebaseConfig } from "./firebaseApp";
import { getOrCreateFirebaseUserProfile } from "./firebaseUsers";

export type FirebaseLoginResult = {
    success: boolean;
    note: string;
    perms?: UserPerms;
    email?: string | null;
    displayName?: string | null;
};

let firebaseAuth: Auth | undefined;
const defaultAdminEmails = [
    "le_son_tung@s2025.ssts.edu.sg",
];

function getFirebaseAuth(): Auth | null {
    const app = getFirebaseApp();
    if (!app) {
        return null;
    }

    if (!firebaseAuth) {
        firebaseAuth = getAuth(app);
    }

    return firebaseAuth ?? null;
}

function adminEmails(): Set<string> {
    return new Set([
        ...defaultAdminEmails,
        ...String(import.meta.env.VITE_FIREBASE_ADMIN_EMAILS ?? "")
            .split(",")
            .map(email => email.trim().toLowerCase())
            .filter(Boolean),
    ]);
}

function adminEmailPerms(user: FirebaseUser): UserPerms {
    const admins = adminEmails();
    const email = user.email?.toLowerCase();

    if (email && admins.has(email)) {
        return UserPerms.Staff;
    }

    return UserPerms.Basic;
}

function googleProvider(): GoogleAuthProvider {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    return provider;
}

async function toLoginResult(user: FirebaseUser): Promise<FirebaseLoginResult> {
    const profile = await getOrCreateFirebaseUserProfile(user, adminEmailPerms(user));
    const perms = profile.perms;

    return {
        success: true,
        note: perms === UserPerms.Staff
            ? "Google login successful."
            : "Google login successful. This account is not an admin.",
        perms,
        email: profile.email,
        displayName: profile.username,
    };
}

function errorCode(error: unknown): string | undefined {
    return typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : undefined;
}

function errorMessage(error: unknown, fallback: string): string {
    const code = errorCode(error);
    const message = error instanceof Error ? error.message : fallback;

    if (code === "auth/configuration-not-found") {
        return "Enable Firebase Authentication and the Google sign-in provider in Firebase Console, then restart the app.";
    }

    if (code === "auth/operation-not-allowed") {
        return "Google sign-in is disabled for this Firebase project. Enable the Google provider in Firebase Authentication.";
    }

    if (code === "auth/unauthorized-domain") {
        return "This app domain is not authorized in Firebase Authentication. Add localhost and 127.0.0.1 to Authorized domains.";
    }

    return code ? `${code}: ${message}` : message;
}

export function isFirebaseAuthConfigured(): boolean {
    return hasFirebaseConfig();
}

export async function signInWithGoogle(): Promise<FirebaseLoginResult> {
    const auth = getFirebaseAuth();

    if (!auth) {
        return {
            success: false,
            note: "Firebase is not configured. Add Firebase Vite environment variables first.",
        };
    }

    try {
        const credential = await signInWithPopup(auth, googleProvider());

        return await toLoginResult(credential.user);
    } catch (error) {
        if (errorCode(error) === "auth/popup-blocked") {
            try {
                await signInWithRedirect(auth, googleProvider());
            } catch (redirectError) {
                return {
                    success: false,
                    note: `Google redirect could not start. ${errorMessage(redirectError, "Try running the web app in a browser.")}`,
                };
            }

            return {
                success: false,
                note: "Redirecting to Google sign-in...",
            };
        }

        return {
            success: false,
            note: errorMessage(error, "Google login failed."),
        };
    }
}

let redirectResultPromise: Promise<FirebaseLoginResult | null> | undefined;

// getRedirectResult() only returns the pending credential once; React's
// StrictMode double-invokes this effect on mount, so without memoizing here
// the first (real) call gets discarded by the effect's own cleanup flag and
// the second call finds nothing left to consume. See consumers in app.tsx.
export function consumeGoogleRedirectResult(): Promise<FirebaseLoginResult | null> {
    if (!redirectResultPromise) {
        redirectResultPromise = (async () => {
            const auth = getFirebaseAuth();

            if (!auth) {
                return null;
            }

            try {
                const credential = await getRedirectResult(auth);

                return credential ? await toLoginResult(credential.user) : null;
            } catch (error) {
                return {
                    success: false,
                    note: errorMessage(error, "Google redirect login failed."),
                };
            }
        })();
    }

    return redirectResultPromise;
}

export async function signOutOfFirebase(): Promise<void> {
    const auth = getFirebaseAuth();

    if (auth) {
        await signOut(auth);
    }
}
