import { initializeApp, type FirebaseApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    type Auth,
    type User as FirebaseUser,
} from "firebase/auth";
import { UserPerms } from "../types";

export type FirebaseLoginResult = {
    success: boolean;
    note: string;
    perms?: UserPerms;
    email?: string | null;
    displayName?: string | null;
};

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;

function hasFirebaseConfig(): boolean {
    return Boolean(
        firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.projectId &&
        firebaseConfig.appId,
    );
}

function getFirebaseAuth(): Auth | null {
    if (!hasFirebaseConfig()) {
        return null;
    }

    if (!firebaseApp) {
        firebaseApp = initializeApp(firebaseConfig);
        firebaseAuth = getAuth(firebaseApp);
    }

    return firebaseAuth ?? null;
}

function adminEmails(): Set<string> {
    return new Set(
        String(import.meta.env.VITE_FIREBASE_ADMIN_EMAILS ?? "")
            .split(",")
            .map(email => email.trim().toLowerCase())
            .filter(Boolean),
    );
}

function permissionsFor(user: FirebaseUser): UserPerms {
    const admins = adminEmails();
    const email = user.email?.toLowerCase();

    if (email && admins.has(email)) {
        return UserPerms.Staff;
    }

    return UserPerms.Basic;
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
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        const credential = await signInWithPopup(auth, provider);
        const { user } = credential;
        const perms = permissionsFor(user);

        return {
            success: true,
            note: perms === UserPerms.Staff
                ? "Google login successful."
                : "Google login successful. This account is not an admin.",
            perms,
            email: user.email,
            displayName: user.displayName,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Google login failed.";
        return {
            success: false,
            note: message,
        };
    }
}
