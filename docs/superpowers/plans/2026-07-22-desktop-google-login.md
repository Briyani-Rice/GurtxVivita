# Desktop Google Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "Continue with Google" works in the Tauri desktop app via system-browser OAuth (PKCE + localhost loopback) bridged into Firebase with `signInWithCredential`.

**Architecture:** A new pure helper module (`googleDesktopOauth.ts`) holds all testable OAuth logic (PKCE, URL building, redirect parsing, token-response parsing). `firebaseAuth.ts` gains a desktop branch that wires those helpers to three Tauri plugins: `oauth` (one-shot localhost server), `opener` (system browser, already installed), and `http` (CORS-free token exchange). The result feeds the existing `toLoginResult()` path unchanged.

**Tech Stack:** Tauri v2, React + TypeScript (Vite), Firebase JS SDK, `tauri-plugin-oauth` (FabianLars), `tauri-plugin-http`.

**Spec:** `docs/superpowers/specs/2026-07-22-desktop-google-login-design.md`

## Global Constraints

- Test command is `npm test` — it runs every `src/**/*.test.ts` file individually through `tsx`. There is NO vitest/jest. Tests use `node:assert/strict`. New test files must follow this pattern and print a success line at the end.
- TypeScript must compile: verify with `npx tsc --noEmit` after each TS task.
- Rust must compile: verify with `cargo check` (run inside `src-tauri/`) after the Rust task.
- Code style: 4-space indent, double quotes, existing inline-style React (no new UI libraries).
- Env var names (exact): `VITE_GOOGLE_DESKTOP_CLIENT_ID`, `VITE_GOOGLE_DESKTOP_CLIENT_SECRET`.
- Commit messages end with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- Web-build Google login behavior (popup + redirect fallback) must NOT change.

---

### Task 1: Tauri plugin scaffolding (oauth + http)

**Files:**
- Modify: `src-tauri/Cargo.toml` (dependencies section)
- Modify: `src-tauri/src/lib.rs` (plugin registration in `run()`)
- Modify: `src-tauri/capabilities/default.json` (permissions)
- Modify: `package.json` / `package-lock.json` (via `npm install`)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: JS plugin modules importable as `@fabianlars/tauri-plugin-oauth` (exports `start(config?): Promise<number>`, `cancel(port: number): Promise<void>`, `onUrl(cb: (url: string) => void): Promise<() => void>`) and `@tauri-apps/plugin-http` (exports `fetch`, same signature as browser fetch). Task 3 depends on these.

- [ ] **Step 1: Add Rust dependencies**

In `src-tauri/Cargo.toml`, add to `[dependencies]` (after `tauri-plugin-os = "2"`):

```toml
tauri-plugin-oauth = "2"
tauri-plugin-http = "2"
```

- [ ] **Step 2: Register plugins in lib.rs**

In `src-tauri/src/lib.rs`, in `run()`, change:

```rust
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
```

to:

```rust
    tauri::Builder::default()
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
```

- [ ] **Step 3: Grant capabilities**

In `src-tauri/capabilities/default.json`, extend the `permissions` array. After `"core:window:allow-start-dragging"` add:

```json
    "oauth:default",
    {
      "identifier": "http:default",
      "allow": [{ "url": "https://oauth2.googleapis.com/*" }]
    }
```

(Resulting array stays valid JSON — add a comma after the previous last entry.)

- [ ] **Step 4: Install JS bindings**

Run: `npm install @fabianlars/tauri-plugin-oauth @tauri-apps/plugin-http`
Expected: both packages added to `package.json` dependencies without errors.

- [ ] **Step 5: Verify Rust compiles**

Run: `cd src-tauri && cargo check`
Expected: `Finished` line, no errors. (First run downloads crates; may take a few minutes.) If `oauth:default` is rejected at schema generation, the error will name permitted identifiers — use `oauth:allow-start` and `oauth:allow-cancel` instead and re-run.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/lib.rs src-tauri/capabilities/default.json package.json package-lock.json
git commit -m "feat: add oauth + http tauri plugins for desktop Google login

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Pure OAuth helper module (TDD)

**Files:**
- Create: `src/services/googleDesktopOauth.ts`
- Test: `src/services/googleDesktopOauth.test.ts`

**Interfaces:**
- Consumes: nothing (pure module; only Web Crypto + URL globals, available in both the webview and Node 18+).
- Produces (Task 3 imports these exact names):
  - `createPkcePair(): Promise<{ verifier: string; challenge: string }>`
  - `pkceChallenge(verifier: string): Promise<string>`
  - `createStateToken(): string`
  - `buildGoogleAuthUrl(opts: { clientId: string; redirectUri: string; state: string; codeChallenge: string }): string`
  - `parseRedirectUrl(rawUrl: string, expectedState: string): { code: string } | { error: string }`
  - `buildTokenRequestBody(opts: { code: string; clientId: string; clientSecret: string; redirectUri: string; codeVerifier: string }): URLSearchParams`
  - `parseTokenResponse(payload: unknown): { idToken: string } | { error: string }`
  - `loopbackResponseHtml: string`

- [ ] **Step 1: Write the failing test**

Create `src/services/googleDesktopOauth.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/services/googleDesktopOauth.test.ts`
Expected: FAIL — cannot find module `./googleDesktopOauth`.

- [ ] **Step 3: Write the implementation**

Create `src/services/googleDesktopOauth.ts`:

```ts
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
        .replaceAll("+", "-")
        .replaceAll("/", "_")
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
    clientSecret: string;
    redirectUri: string;
    codeVerifier: string;
}): URLSearchParams {
    return new URLSearchParams({
        grant_type: "authorization_code",
        code: opts.code,
        client_id: opts.clientId,
        client_secret: opts.clientSecret,
        redirect_uri: opts.redirectUri,
        code_verifier: opts.codeVerifier,
    });
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/services/googleDesktopOauth.test.ts`
Expected: `googleDesktopOauth checks passed`

- [ ] **Step 5: Verify types and the full suite**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; every test file prints its success line.

- [ ] **Step 6: Commit**

```bash
git add src/services/googleDesktopOauth.ts src/services/googleDesktopOauth.test.ts
git commit -m "feat: pure OAuth PKCE helpers for desktop Google login

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Desktop sign-in flow in firebaseAuth.ts

**Files:**
- Modify: `src/services/firebaseAuth.ts`
- Test: `src/services/firebaseAuth.test.ts` (update source assertions)

**Interfaces:**
- Consumes: everything listed in Task 2's Produces block; plugin JS APIs from Task 1 (`start`, `cancel`, `onUrl` from `@fabianlars/tauri-plugin-oauth`; `fetch` from `@tauri-apps/plugin-http`; `openUrl` from `@tauri-apps/plugin-opener`).
- Produces: `signInWithGoogle()` now works under Tauri; `isGoogleLoginSupported()` returns true under Tauri when Firebase config AND both desktop env vars are set. Signatures unchanged — `LoginTab.tsx` needs no API changes.

- [ ] **Step 1: Update source assertions in firebaseAuth.test.ts**

In `src/services/firebaseAuth.test.ts`, replace the block:

```ts
assert.match(
    authSource,
    /Google login is only available in the browser build/,
    "Firebase auth service should explain why Google login is disabled in the desktop app",
);
```

with:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/services/firebaseAuth.test.ts`
Expected: FAIL on the `signInWithCredential` assertion.

- [ ] **Step 3: Implement the desktop flow**

In `src/services/firebaseAuth.ts`:

3a. Extend the firebase/auth import to include `signInWithCredential`:

```ts
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
```

3b. Add below the firebase imports:

```ts
import {
    buildGoogleAuthUrl,
    buildTokenRequestBody,
    createPkcePair,
    createStateToken,
    loopbackResponseHtml,
    parseRedirectUrl,
    parseTokenResponse,
} from "./googleDesktopOauth";
```

3c. Add after the `isTauriRuntime()` function:

```ts
const DESKTOP_LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

function desktopOauthClient(): { clientId: string; clientSecret: string } | null {
    const clientId = String(import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_ID ?? "").trim();
    const clientSecret = String(import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_SECRET ?? "").trim();

    return clientId && clientSecret ? { clientId, clientSecret } : null;
}
```

3d. Replace `isGoogleLoginSupported()`:

```ts
export function isGoogleLoginSupported(): boolean {
    if (!hasFirebaseConfig()) {
        return false;
    }

    return !isTauriRuntime() || desktopOauthClient() !== null;
}
```

3e. Add the desktop flow (place directly above `signInWithGoogle`):

```ts
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
        unlisten?.();
        cancel(port).catch(() => {});
    }
}
```

3f. In `signInWithGoogle()`, replace the leading Tauri short-circuit:

```ts
export async function signInWithGoogle(): Promise<FirebaseLoginResult> {
    if (isTauriRuntime()) {
        return {
            success: false,
            note: "Google login is only available in the browser build. Use the demo login in the desktop app.",
        };
    }

    const auth = getFirebaseAuth();
```

with:

```ts
export async function signInWithGoogle(): Promise<FirebaseLoginResult> {
    const auth = getFirebaseAuth();
```

and directly after the existing `if (!auth) { ... }` block, add:

```ts
    if (isTauriRuntime()) {
        return signInWithGoogleDesktop(auth);
    }
```

(The rest of the web popup/redirect logic stays exactly as-is.)

- [ ] **Step 4: Run tests and types**

Run: `npx tsx src/services/firebaseAuth.test.ts && npx tsc --noEmit && npm test`
Expected: all pass. (`firebaseAuth.test.ts` still asserts the popup/redirect web flow — it must keep passing.)

- [ ] **Step 5: Commit**

```bash
git add src/services/firebaseAuth.ts src/services/firebaseAuth.test.ts
git commit -m "feat: desktop Google login via loopback OAuth + signInWithCredential

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Login UI copy + env documentation

**Files:**
- Modify: `src/components/LoginTab.tsx:276-301` (button title + labels)
- Modify: `.env.example`
- Test: `src/services/firebaseAuth.test.ts` (update loginSource + env assertions)

**Interfaces:**
- Consumes: `isGoogleLoginSupported()` from Task 3 (already imported by LoginTab; no import changes).
- Produces: final user-facing copy. Exact strings (tests depend on them): `"Opening your browser..."`, `"Configure desktop Google login"`, `"Set VITE_GOOGLE_DESKTOP_CLIENT_ID and VITE_GOOGLE_DESKTOP_CLIENT_SECRET in .env to enable Google login in the desktop app"`.

- [ ] **Step 1: Update test assertions**

In `src/services/firebaseAuth.test.ts`:

1a. Replace:

```ts
assert.match(
    loginSource,
    /Google login unavailable in desktop app/,
    "Login tab should show a clear desktop-app Google login message",
);
```

with:

```ts
assert.match(
    loginSource,
    /Configure desktop Google login/,
    "Login tab should point at desktop OAuth configuration instead of claiming Google login is impossible",
);

assert.match(
    loginSource,
    /Opening your browser\.\.\./,
    "Login tab should tell the user their browser is opening during desktop Google login",
);

assert.doesNotMatch(
    loginSource,
    /unavailable in desktop app/,
    "Login tab must not claim Google login is unavailable on desktop anymore",
);
```

1b. In the `.env.example` key loop, extend the array with the two new keys:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/services/firebaseAuth.test.ts`
Expected: FAIL on `Configure desktop Google login`.

- [ ] **Step 3: Update LoginTab.tsx button copy**

In the Google button (`src/components/LoginTab.tsx`), replace the `title` attribute:

```tsx
                    title={
                        googleLoginSupported
                            ? "Sign in with Google"
                            : firebaseConfigured
                                ? "Google login is only available in the browser build"
                            : "Add Firebase Vite environment variables to enable Google login"
                    }
```

with:

```tsx
                    title={
                        googleLoginSupported
                            ? "Sign in with Google"
                            : firebaseConfigured
                                ? "Set VITE_GOOGLE_DESKTOP_CLIENT_ID and VITE_GOOGLE_DESKTOP_CLIENT_SECRET in .env to enable Google login in the desktop app"
                            : "Add Firebase Vite environment variables to enable Google login"
                    }
```

and replace the button label block:

```tsx
                    {googleLoading
                        ? "Opening Google..."
                        : googleLoginSupported
                            ? "Continue with Google"
                            : firebaseConfigured
                                ? "Google login unavailable in desktop app"
                                : "Configure Firebase for Google login"}
```

with:

```tsx
                    {googleLoading
                        ? "Opening your browser..."
                        : googleLoginSupported
                            ? "Continue with Google"
                            : firebaseConfigured
                                ? "Configure desktop Google login"
                                : "Configure Firebase for Google login"}
```

- [ ] **Step 4: Document env vars**

In `.env.example`, append after the existing `VITE_FIREBASE_*` block:

```bash
# Desktop (Tauri) Google login: Google Cloud console -> APIs & Services ->
# Credentials -> Create OAuth client ID -> type "Desktop app".
# The desktop-app client secret is non-confidential per Google's installed-app model.
VITE_GOOGLE_DESKTOP_CLIENT_ID=
VITE_GOOGLE_DESKTOP_CLIENT_SECRET=
```

- [ ] **Step 5: Run tests and types**

Run: `npx tsc --noEmit && npm test`
Expected: all files pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/LoginTab.tsx .env.example src/services/firebaseAuth.test.ts
git commit -m "feat: desktop Google login UI copy and env documentation

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Manual end-to-end verification

**Files:** none (manual gate; requires the human's Google Cloud console access).

**Interfaces:**
- Consumes: the complete flow from Tasks 1-4.
- Produces: verified working desktop Google login.

- [ ] **Step 1: Create the OAuth client (human step)**

Ask the user to:
1. Open https://console.cloud.google.com/apis/credentials (project = the Firebase project).
2. Create Credentials → OAuth client ID → Application type **Desktop app** → name e.g. "GurtxVivita Desktop".
3. Copy the Client ID and Client secret into `.env` as `VITE_GOOGLE_DESKTOP_CLIENT_ID` / `VITE_GOOGLE_DESKTOP_CLIENT_SECRET`.

- [ ] **Step 2: Run the desktop app**

Run: `npm run tauri dev`
Expected: Login tab shows an enabled **Continue with Google** button (not "Configure desktop Google login").

- [ ] **Step 3: Full round-trip**

Click the button. Expected: default browser opens Google's account picker → after sign-in the browser shows "Login complete — You can close this tab and return to the app." → the app lands on Admin View (for `le_son_tung@s2025.ssts.edu.sg`) or User View for other accounts.

- [ ] **Step 4: Failure paths**

- Click the button, then close the browser tab without signing in → after 5 minutes the app shows "Timed out waiting for Google sign-in in the browser." and the button re-enables. (Or click Cancel on Google's consent screen → immediate "Google sign-in was cancelled or failed (access_denied).")
- Remove `VITE_GOOGLE_DESKTOP_CLIENT_ID` from `.env`, restart → button shows "Configure desktop Google login" and is disabled.

- [ ] **Step 5: Final commit of any fixes; then finishing-a-development-branch**

If verification exposed fixes, commit them with the same message convention, re-run `npm test`, and proceed to the superpowers:finishing-a-development-branch skill.
