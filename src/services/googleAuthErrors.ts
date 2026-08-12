const MESSAGES: Record<string, string> = {
    "auth/configuration-not-found":
        "Enable Firebase Authentication and the Google sign-in provider in Firebase Console, then restart the app.",
    "auth/operation-not-allowed":
        "Google sign-in is disabled for this Firebase project. Enable the Google provider in Firebase Authentication.",
    "auth/unauthorized-domain":
        "This app's domain is not authorized. In Firebase Console → Authentication → Settings → Authorized domains, add the site's domain (for the live app, gurtxvivita-4c370.web.app) plus localhost and 127.0.0.1.",
    "auth/popup-closed-by-user":
        "The Google sign-in window was closed before finishing. Try again and complete the sign-in.",
    "auth/cancelled-popup-request":
        "A previous sign-in was still open. Try again.",
    "auth/network-request-failed":
        "Network error reaching Google. Check the connection and try again.",
};

// Tauri plugin commands reject with plain strings (e.g. an ACL denial), and
// Firebase rejects with Error objects. Reading only Error.message threw the
// string ones away and reported the caller's generic fallback instead, which
// made an "oauth.start not allowed" ACL denial indistinguishable from a network
// failure. Keep whatever detail the rejection carries.
export function errorDetail(error: unknown, fallback: string): string {
    if (typeof error === "string") {
        return error.trim() || fallback;
    }

    if (error instanceof Error) {
        return error.message.trim() || fallback;
    }

    if (typeof error === "object" && error !== null && "message" in error) {
        const message = String((error as { message?: unknown }).message ?? "").trim();

        if (message) {
            return message;
        }
    }

    return fallback;
}

export function googleAuthErrorMessage(code: string | undefined, fallback: string): string {
    if (code && MESSAGES[code]) {
        return MESSAGES[code];
    }

    return code ? `${code}: ${fallback}` : fallback;
}

export function isProgressNote(result: { success: boolean; redirecting?: boolean }): boolean {
    return !result.success && result.redirecting === true;
}
