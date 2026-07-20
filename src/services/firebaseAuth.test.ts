import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const authSource = readFileSync(new URL("./firebaseAuth.ts", import.meta.url), "utf8");
const loginSource = readFileSync(new URL("../components/LoginTab.tsx", import.meta.url), "utf8");
const envExampleSource = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");

assert.match(
    authSource,
    /initializeApp/,
    "Firebase auth service should initialize the Firebase app from Vite config",
);

assert.match(
    authSource,
    /GoogleAuthProvider/,
    "Firebase auth service should configure the Google auth provider",
);

assert.match(
    authSource,
    /signInWithPopup/,
    "Firebase auth service should use the official popup flow for Google sign-in",
);

assert.match(
    authSource,
    /VITE_FIREBASE_ADMIN_EMAILS/,
    "Firebase auth service should support admin email allow-listing",
);

assert.match(
    loginSource,
    /signInWithGoogle/,
    "Login tab should offer Firebase Google sign-in",
);

assert.match(
    loginSource,
    /Continue with Google/,
    "Login tab should render a clear Google sign-in button",
);

assert.match(
    loginSource,
    /isFirebaseAuthConfigured/,
    "Login tab should avoid offering an active Google sign-in button when Firebase env is missing",
);

for (const key of [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_ADMIN_EMAILS",
]) {
    assert.match(envExampleSource, new RegExp(`${key}=`), `.env.example should document ${key}`);
}

console.log("firebaseAuth source checks passed");
