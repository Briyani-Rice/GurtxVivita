import assert from "node:assert/strict";
import {
    buildGoogleAuthUrl,
    buildTokenRequestBody,
    createPkcePair,
    createStateToken,
    loopbackResponseHtml,
    parseRedirectUrl,
    parseTokenResponse,
    pkceChallenge,
} from "./googleDesktopOauth";

async function main() {
    // PKCE: known-answer S256 test (sha256("test") base64url-encoded)
    assert.equal(
        await pkceChallenge("test"),
        "n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg",
        "pkceChallenge must be base64url(sha256(verifier))",
    );

    const pkce = await createPkcePair();
    assert.ok(pkce.verifier.length >= 43, "PKCE verifier must be at least 43 chars");
    assert.match(pkce.verifier, /^[A-Za-z0-9_-]+$/, "verifier must be base64url");
    assert.match(pkce.challenge, /^[A-Za-z0-9_-]+$/, "challenge must be base64url");
    assert.equal(pkce.challenge, await pkceChallenge(pkce.verifier));

    // State token: random and url-safe
    const state = createStateToken();
    assert.ok(state.length >= 16, "state token must be at least 16 chars");
    assert.match(state, /^[A-Za-z0-9_-]+$/, "state token must be base64url");
    assert.notEqual(createStateToken(), state, "state tokens must be random");

    // Auth URL
    const authUrl = new URL(buildGoogleAuthUrl({
        clientId: "cid.apps.googleusercontent.com",
        redirectUri: "http://localhost:14155",
        state: "st123",
        codeChallenge: "chal",
    }));
    assert.equal(authUrl.origin + authUrl.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
    assert.equal(authUrl.searchParams.get("client_id"), "cid.apps.googleusercontent.com");
    assert.equal(authUrl.searchParams.get("redirect_uri"), "http://localhost:14155");
    assert.equal(authUrl.searchParams.get("response_type"), "code");
    assert.equal(authUrl.searchParams.get("scope"), "openid email profile");
    assert.equal(authUrl.searchParams.get("code_challenge"), "chal");
    assert.equal(authUrl.searchParams.get("code_challenge_method"), "S256");
    assert.equal(authUrl.searchParams.get("state"), "st123");
    assert.equal(authUrl.searchParams.get("prompt"), "select_account");

    // Redirect parsing: happy path
    assert.deepEqual(
        parseRedirectUrl("http://localhost:14155/?state=st123&code=4%2FabcDEF&scope=email", "st123"),
        { code: "4/abcDEF" },
    );
    // state mismatch must never return a code
    const mismatch = parseRedirectUrl("http://localhost:14155/?state=evil&code=4%2FabcDEF", "st123");
    assert.ok("error" in mismatch, "state mismatch must fail");
    // user cancelled
    const denied = parseRedirectUrl("http://localhost:14155/?error=access_denied&state=st123", "st123");
    assert.ok("error" in denied, "error param must fail");
    // garbage input
    const garbage = parseRedirectUrl("not a url", "st123");
    assert.ok("error" in garbage, "unparseable URL must fail");
    // missing code
    const noCode = parseRedirectUrl("http://localhost:14155/?state=st123", "st123");
    assert.ok("error" in noCode, "missing code must fail");

    // Token request body
    const body = buildTokenRequestBody({
        code: "4/abcDEF",
        clientId: "cid",
        clientSecret: "sec",
        redirectUri: "http://localhost:14155",
        codeVerifier: "ver",
    });
    assert.equal(body.get("grant_type"), "authorization_code");
    assert.equal(body.get("code"), "4/abcDEF");
    assert.equal(body.get("client_id"), "cid");
    assert.equal(body.get("client_secret"), "sec");
    assert.equal(body.get("redirect_uri"), "http://localhost:14155");
    assert.equal(body.get("code_verifier"), "ver");

    const publicClientBody = buildTokenRequestBody({
        code: "4/publicClient",
        clientId: "desktop-cid",
        redirectUri: "http://localhost:14155",
        codeVerifier: "public-ver",
    });
    assert.equal(
        publicClientBody.has("client_secret"),
        false,
        "Desktop PKCE token exchange should work without a client secret",
    );

    // Token response parsing
    assert.deepEqual(parseTokenResponse({ id_token: "jwt123" }), { idToken: "jwt123" });
    assert.ok("error" in parseTokenResponse({ access_token: "no-id-token" }));
    assert.ok("error" in parseTokenResponse(null));
    const detailed = parseTokenResponse({ error: "invalid_grant", error_description: "Bad code" });
    assert.ok("error" in detailed && detailed.error.includes("Bad code"), "token error should surface Google's description");

    // Loopback response page
    assert.match(loopbackResponseHtml, /close this tab/i, "loopback page should tell the user to close the tab");

    console.log("googleDesktopOauth checks passed");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
