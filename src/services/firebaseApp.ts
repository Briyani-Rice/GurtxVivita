import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const firestoreDatabaseId = String(import.meta.env.VITE_FIREBASE_DATABASE_ID ?? "").trim();

let firebaseApp: FirebaseApp | undefined;
let firestoreDb: Firestore | undefined;

export function hasFirebaseConfig(): boolean {
    return Boolean(
        firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.projectId &&
        firebaseConfig.appId,
    );
}

export function getFirebaseApp(): FirebaseApp | null {
    if (!hasFirebaseConfig()) {
        return null;
    }

    if (!firebaseApp) {
        firebaseApp = initializeApp(firebaseConfig);
    }

    return firebaseApp;
}

export function getFirebaseFirestore(): Firestore {
    const app = getFirebaseApp();

    if (!app) {
        throw new Error("Firebase is not configured. Add Firebase Vite environment variables first.");
    }

    if (!firestoreDb) {
        firestoreDb = firestoreDatabaseId
            ? getFirestore(app, firestoreDatabaseId)
            : getFirestore(app);
    }

    return firestoreDb;
}
