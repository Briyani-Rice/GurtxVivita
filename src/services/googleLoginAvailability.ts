export type GoogleLoginAvailability =
    | { available: true; runtime: "web" | "desktop" }
    | {
        available: false;
        runtime: "web" | "desktop";
        reason: "firebase-config" | "desktop-oauth-config";
        note: string;
    };

type GoogleLoginAvailabilityInput = {
    firebaseConfigured: boolean;
    desktop: boolean;
    desktopOauthConfigured: boolean;
};

export function getGoogleLoginAvailability({
    firebaseConfigured,
    desktop,
    desktopOauthConfigured,
}: GoogleLoginAvailabilityInput): GoogleLoginAvailability {
    const runtime = desktop ? "desktop" : "web";

    if (!firebaseConfigured) {
        return {
            available: false,
            runtime,
            reason: "firebase-config",
            note: "Firebase is not configured. Add the VITE_FIREBASE_* environment variables and restart the app.",
        };
    }

    if (desktop && !desktopOauthConfigured) {
        return {
            available: false,
            runtime,
            reason: "desktop-oauth-config",
            note: "Desktop Google login needs a Google Cloud OAuth client of type Desktop app. Set VITE_GOOGLE_DESKTOP_CLIENT_ID, then rebuild the app.",
        };
    }

    return { available: true, runtime };
}
