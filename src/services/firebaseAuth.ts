import {
    getAuth,
    getRedirectResult,
    GoogleAuthProvider,
    signInWithCredential,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    type Auth,
    type User as FirebaseUser,
} from "firebase/auth";
import {
    buildGoogleAuthUrl,
    buildTokenRequestBody,
    createPkcePair,
    createStateToken,
    loopbackResponseHtml,
    parseRedirectUrl,
    parseTokenResponse,
} from "./googleDesktopOauth";
import { googleAuthErrorMessage } from "./googleAuthErrors";
import { UserPerms } from "../types";
import { getFirebaseApp, hasFirebaseConfig } from "./firebaseApp";
import { getOrCreateFirebaseUserProfile } from "./firebaseUsers";

export type FirebaseLoginResult = {
    success: boolean;
    note: string;
    // The popup was blocked and a full-page redirect is now under way. This is
    // an in-progress state, not a failure, so callers should not show it in red.
    redirecting?: boolean;
    perms?: UserPerms;
    email?: string | null;
    displayName?: string | null;
};

let firebaseAuth: Auth | undefined;
// Admin emails come from the VITE_FIREBASE_ADMIN_EMAILS env var only — no
// personal emails are hardcoded in the shipped bundle. See adminEmails().
const defaultAdminEmails: string[] = [];

function isTauriRuntime(): boolean {
    return typeof window !== "undefined"
        && (
            "__TAURI_INTERNALS__" in window
            || "__TAURI__" in window
            // Official Tauri v2 marker; present even when `withGlobalTauri` is off.
            || "isTauri" in window
        );
}

const DESKTOP_LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

function desktopOauthClient(): { clientId: string; clientSecret: string } | null {
    const clientId = String(import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_ID ?? "").trim();
    const clientSecret = String(import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_SECRET ?? "").trim();

    return clientId && clientSecret ? { clientId, clientSecret } : null;
}

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

    return googleAuthErrorMessage(code, message);
}

export function isFirebaseAuthConfigured(): boolean {
    return hasFirebaseConfig();
}

export function isGoogleLoginSupported(): boolean {
    if (!hasFirebaseConfig()) {
        return false;
    }

    return !isTauriRuntime() || desktopOauthClient() !== null;
}

// Desktop (Tauri) flow: Google blocks OAuth inside embedded webviews, so we
// sign in through the system browser and catch the redirect on a one-shot
// localhost server, then bridge the id_token into Firebase.
async function signInWithGoogleDesktop(auth: Auth): Promise<FirebaseLoginResult> {
    const client = desktopOauthClient();

    if (!client) {
        return {
            success: false,
            note: "Set VITE_GOOGLE_DESKTOP_CLIENT_ID and VITE_GOOGLE_DESKTOP_CLIENT_SECRET to enable Google login in the desktop app.",
        };
    }

    const [{ start, cancel, onUrl }, { openUrl }, { fetch: tauriFetch }] = await Promise.all([
        import("@fabianlars/tauri-plugin-oauth"),
        import("@tauri-apps/plugin-opener"),
        import("@tauri-apps/plugin-http"),
    ]);

    const port = await start({ response: loopbackResponseHtml });
    const redirectUri = `http://localhost:${port}`;
    let unlisten: (() => void) | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
        const { verifier, challenge } = await createPkcePair();
        const state = createStateToken();

        const redirectUrlPromise = new Promise<string>((resolve, reject) => {
            timeout = setTimeout(
                () => reject(new Error("Timed out waiting for Google sign-in in the browser.")),
                DESKTOP_LOGIN_TIMEOUT_MS,
            );
            onUrl(url => resolve(url))
                .then(stop => {
                    unlisten = stop;
                })
                .catch(reject);
        });

        await openUrl(buildGoogleAuthUrl({
            clientId: client.clientId,
            redirectUri,
            state,
            codeChallenge: challenge,
        }));

        const redirect = parseRedirectUrl(await redirectUrlPromise, state);

        if ("error" in redirect) {
            return { success: false, note: redirect.error };
        }

        const tokenResponse = await tauriFetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: buildTokenRequestBody({
                code: redirect.code,
                clientId: client.clientId,
                clientSecret: client.clientSecret,
                redirectUri,
                codeVerifier: verifier,
            }).toString(),
        });

        const token = parseTokenResponse(await tokenResponse.json().catch(() => null));

        if ("error" in token) {
            return { success: false, note: token.error };
        }

        const credential = await signInWithCredential(
            auth,
            GoogleAuthProvider.credential(token.idToken),
        );

        return await toLoginResult(credential.user);
    } catch (error) {
        return {
            success: false,
            note: errorMessage(error, "Google login failed."),
        };
    } finally {
        if (timeout) {
            clearTimeout(timeout);
        }
        try {
            unlisten?.();
        } catch {
            // listener may already be gone
        }
        cancel(port).catch(() => {});
    }
}

export async function signInWithGoogle(): Promise<FirebaseLoginResult> {
    const auth = getFirebaseAuth();

    if (!auth) {
        return {
            success: false,
            note: "Firebase is not configured. Add Firebase Vite environment variables first.",
        };
    }

    if (isTauriRuntime()) {
        return signInWithGoogleDesktop(auth);
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
                redirecting: true,
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
