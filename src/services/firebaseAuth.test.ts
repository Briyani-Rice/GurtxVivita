import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const authSource = readFileSync(new URL("./firebaseAuth.ts", import.meta.url), "utf8");
const appSource = readFileSync(new URL("./firebaseApp.ts", import.meta.url), "utf8");
const loginSource = readFileSync(new URL("../components/LoginTab.tsx", import.meta.url), "utf8");
const appEntrySource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const envExampleSource = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");

assert.match(
    appSource,
    /initializeApp/,
    "Shared Firebase app service should initialize Firebase from Vite config",
);

assert.match(
    authSource,
    /getFirebaseApp/,
    "Firebase auth service should reuse the shared Firebase app",
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
    /signInWithRedirect/,
    "Firebase auth service should fall back to redirect when the popup is blocked",
);

assert.match(
    authSource,
    /getRedirectResult/,
    "Firebase auth service should read Google redirect results when the login page loads",
);

assert.match(
    authSource,
    /auth\/popup-blocked/,
    "Firebase auth service should explicitly handle blocked popup errors",
);

assert.match(
    authSource,
    /auth\/configuration-not-found/,
    "Firebase auth service should explain when Firebase Authentication or Google provider is not enabled",
);

assert.match(
    authSource,
    /Enable Firebase Authentication and the Google sign-in provider/,
    "Firebase auth service should give an actionable fix for missing auth configuration",
);

assert.match(
    authSource,
    /Google redirect could not start/,
    "Firebase auth service should surface redirect startup failures instead of throwing to the UI",
);

assert.match(
    authSource,
    /VITE_FIREBASE_ADMIN_EMAILS/,
    "Firebase auth service should support admin email allow-listing",
);

assert.match(
    authSource,
    /le_son_tung@s2025\.ssts\.edu\.sg/,
    "Firebase auth service should make Le Son Tung's school Google account admin",
);

assert.match(
    authSource,
    /function isTauriRuntime/,
    "Firebase auth service should detect the packaged Tauri runtime",
);

assert.match(
    authSource,
    /isGoogleLoginSupported/,
    "Firebase auth service should expose whether Google login is supported in the current runtime",
);

assert.match(
    authSource,
    /Google login is only available in the browser build/,
    "Firebase auth service should explain why Google login is disabled in the desktop app",
);

assert.match(
    authSource,
    /redirectResultPromise/,
    "consumeGoogleRedirectResult should memoize the pending redirect promise so React StrictMode's double effect invocation can't let the real result be consumed once and then discarded, silently stranding the user on the default tab",
);

assert.match(
    appEntrySource,
    /alert\(`Google sign-in failed/,
    "App entry point should surface a failed Google redirect to the user instead of only logging it to the console",
);

assert.match(
    loginSource,
    /signInWithGoogle/,
    "Login tab should offer Firebase Google sign-in",
);

assert.match(
    appEntrySource,
    /consumeGoogleRedirectResult/,
    "App entry point should complete Google login after a Tauri redirect reloads the app, since the Login tab no longer exists at that point",
);

assert.doesNotMatch(
    loginSource,
    /consumeGoogleRedirectResult/,
    "Login tab should not own redirect-result handling: a redirect reload discards the Login tab before it can run",
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

assert.match(
    loginSource,
    /isGoogleLoginSupported/,
    "Login tab should also disable Google sign-in in runtimes where Firebase popup auth cannot complete",
);

assert.match(
    loginSource,
    /Google login unavailable in desktop app/,
    "Login tab should show a clear desktop-app Google login message",
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
