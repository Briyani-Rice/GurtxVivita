// Pure helpers for the desktop (Tauri) Google OAuth loopback flow.
// No Firebase or Tauri imports here so the module stays testable under Node.

export type PkcePair = {
    verifier: string;
    challenge: string;
};

function base64UrlEncode(bytes: Uint8Array): string {
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export function createStateToken(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    return base64UrlEncode(bytes);
}

export async function pkceChallenge(verifier: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));

    return base64UrlEncode(new Uint8Array(digest));
}

export async function createPkcePair(): Promise<PkcePair> {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const verifier = base64UrlEncode(bytes);

    return { verifier, challenge: await pkceChallenge(verifier) };
}

export function buildGoogleAuthUrl(opts: {
    clientId: string;
    redirectUri: string;
    state: string;
    codeChallenge: string;
}): string {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", opts.clientId);
    url.searchParams.set("redirect_uri", opts.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("code_challenge", opts.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("state", opts.state);
    url.searchParams.set("prompt", "select_account");

    return url.toString();
}

export function parseRedirectUrl(
    rawUrl: string,
    expectedState: string,
): { code: string } | { error: string } {
    let url: URL;

    try {
        url = new URL(rawUrl);
    } catch {
        return { error: "Invalid redirect URL from Google." };
    }

    const oauthError = url.searchParams.get("error");

    if (oauthError) {
        return { error: `Google sign-in was cancelled or failed (${oauthError}).` };
    }

    const code = url.searchParams.get("code");

    if (!code) {
        return { error: "Google redirect did not include an authorization code." };
    }

    if (url.searchParams.get("state") !== expectedState) {
        return { error: "Google sign-in state check failed. Please try again." };
    }

    return { code };
}

export function buildTokenRequestBody(opts: {
    code: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    codeVerifier: string;
}): URLSearchParams {
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: opts.code,
        client_id: opts.clientId,
        redirect_uri: opts.redirectUri,
        code_verifier: opts.codeVerifier,
    });

    if (opts.clientSecret) {
        body.set("client_secret", opts.clientSecret);
    }

    return body;
}

export function parseTokenResponse(payload: unknown): { idToken: string } | { error: string } {
    const record = typeof payload === "object" && payload !== null
        ? payload as Record<string, unknown>
        : undefined;
    const idToken = record && typeof record.id_token === "string" ? record.id_token : "";

    if (idToken) {
        return { idToken };
    }

    const detail = record && typeof record.error_description === "string"
        ? record.error_description
        : record && typeof record.error === "string"
            ? record.error
            : "no id_token in response";

    return { error: `Google token exchange failed: ${detail}` };
}

export const loopbackResponseHtml = [
    "<html><body style=\"font-family: sans-serif; text-align: center; padding-top: 15vh\">",
    "<h2>Login complete</h2>",
    "<p>You can close this tab and return to the app.</p>",
    "</body></html>",
].join("");
