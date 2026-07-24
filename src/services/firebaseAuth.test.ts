import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const authSource = readFileSync(new URL("./firebaseAuth.ts", import.meta.url), "utf8");
const appSource = readFileSync(new URL("./firebaseApp.ts", import.meta.url), "utf8");
const loginSource = readFileSync(new URL("../components/LoginTab.tsx", import.meta.url), "utf8");
const appEntrySource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
const envExampleSource = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
const authErrorsSource = readFileSync(new URL("./googleAuthErrors.ts", import.meta.url), "utf8");

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
    /googleAuthErrorMessage/,
    "Firebase auth service should map error codes to messages through the shared googleAuthErrors helper",
);

assert.match(
    authErrorsSource,
    /auth\/configuration-not-found/,
    "Auth error helper should explain when Firebase Authentication or Google provider is not enabled",
);

assert.match(
    authErrorsSource,
    /Enable Firebase Authentication and the Google sign-in provider/,
    "Auth error helper should give an actionable fix for missing auth configuration",
);

assert.match(
    authErrorsSource,
    /auth\/unauthorized-domain/,
    "Auth error helper should explain the unauthorized-domain failure with the Console fix",
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

assert.doesNotMatch(
    authSource,
    /@s2025\.ssts\.edu\.sg/,
    "Firebase auth service should not hardcode a personal admin email in the bundle (admins come from VITE_FIREBASE_ADMIN_EMAILS)",
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
    /signInWithCredential/,
    "Firebase auth service should bridge the desktop OAuth id_token into Firebase with signInWithCredential",
);

assert.match(
    authSource,
    /signInWithGoogleDesktop/,
    "Firebase auth service should have a dedicated desktop (Tauri) Google sign-in flow",
);

assert.match(
    authSource,
    /googleDesktopOauth/,
    "Firebase auth service should reuse the pure desktop OAuth helpers",
);

assert.match(
    authSource,
    /VITE_GOOGLE_DESKTOP_CLIENT_ID/,
    "Firebase auth service should read the desktop OAuth client ID from Vite env",
);

assert.match(
    authSource,
    /oauth2\.googleapis\.com\/token/,
    "Firebase auth service should exchange the auth code at Google's token endpoint",
);

assert.match(
    authSource,
    /Timed out waiting for Google sign-in/,
    "Firebase auth service should time out if the user abandons the browser sign-in",
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
    /t\("login\.google"\)/,
    "Login tab should render a clear Google sign-in button",
);

assert.match(
    readFileSync(new URL("../i18n/i18n.ts", import.meta.url), "utf8"),
    /"login\.google": "Continue with Google"/,
    "Google sign-in button should have English copy in the i18n dictionary",
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
    /t\("login\.googleConfigureDesktop"\)/,
    "Login tab should point at desktop OAuth configuration instead of claiming Google login is impossible",
);

const i18nSource = readFileSync(new URL("../i18n/i18n.ts", import.meta.url), "utf8");

assert.match(
    i18nSource,
    /"login\.googleConfigureDesktop": "Configure desktop Google login"/,
    "Desktop Google configuration message should have English copy in the i18n dictionary",
);

assert.match(
    i18nSource,
    /"login\.googleOpening": "Opening your browser\.\.\."/,
    "Desktop Google login should tell the user their browser is opening (English copy)",
);

assert.doesNotMatch(
    i18nSource,
    /googleUnavailableDesktop/,
    "The unavailable-on-desktop key must be fully renamed — Google login now works on desktop",
);

for (const key of [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_ADMIN_EMAILS",
    "VITE_GOOGLE_DESKTOP_CLIENT_ID",
    "VITE_GOOGLE_DESKTOP_CLIENT_SECRET",
]) {
    assert.match(envExampleSource, new RegExp(`${key}=`), `.env.example should document ${key}`);
}

// The Tauri runtime globals are injected during webview startup and may be
// absent at React's first synchronous render, which made the Google button flip
// between "Sign in with Google" and "Configure desktop Google login" from run to
// run. Detection must cover the official `isTauri` global and be re-checked after
// mount so the label settles deterministically on the real runtime.
assert.match(
    authSource,
    /"isTauri" in window/,
    "isTauriRuntime should also honor the official Tauri v2 `window.isTauri` global",
);

assert.match(
    loginSource,
    /useState\(isGoogleLoginSupported\)/,
    "LoginTab should seed Google support from a lazy state initializer, not a one-shot const",
);

assert.match(
    loginSource,
    /setGoogleLoginSupported\(isGoogleLoginSupported\(\)\)/,
    "LoginTab should re-check Google support after mount so a lost startup race self-corrects",
);

assert.match(
    loginSource,
    /setFirebaseConfigured\(isFirebaseAuthConfigured\(\)\)/,
    "LoginTab should re-check Firebase configuration after mount alongside Google support",
);

console.log("firebaseAuth source checks passed");
