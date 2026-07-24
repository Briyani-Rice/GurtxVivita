import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const moduleUrl = new URL("./googleLoginAvailability.ts", import.meta.url);

assert.ok(
    existsSync(moduleUrl),
    "Google login availability should have one shared, testable source of truth",
);

const { getGoogleLoginAvailability } = await import("./googleLoginAvailability.ts");

assert.deepEqual(
    getGoogleLoginAvailability({
        firebaseConfigured: false,
        desktop: false,
        desktopOauthConfigured: false,
    }),
    {
        available: false,
        runtime: "web",
        reason: "firebase-config",
        note: "Firebase is not configured. Add the VITE_FIREBASE_* environment variables and restart the app.",
    },
);

assert.deepEqual(
    getGoogleLoginAvailability({
        firebaseConfigured: true,
        desktop: true,
        desktopOauthConfigured: false,
    }),
    {
        available: false,
        runtime: "desktop",
        reason: "desktop-oauth-config",
        note: "Desktop Google login needs a Google Cloud OAuth client of type Desktop app. Set VITE_GOOGLE_DESKTOP_CLIENT_ID and VITE_GOOGLE_DESKTOP_CLIENT_SECRET, then rebuild the app.",
    },
);

assert.deepEqual(
    getGoogleLoginAvailability({
        firebaseConfigured: true,
        desktop: false,
        desktopOauthConfigured: false,
    }),
    { available: true, runtime: "web" },
);

assert.deepEqual(
    getGoogleLoginAvailability({
        firebaseConfigured: true,
        desktop: true,
        desktopOauthConfigured: true,
    }),
    { available: true, runtime: "desktop" },
);

console.log("googleLoginAvailability tests passed");
