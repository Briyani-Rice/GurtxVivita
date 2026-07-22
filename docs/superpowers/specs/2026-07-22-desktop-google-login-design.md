# Desktop Google Login — Design

**Date:** 2026-07-22
**Status:** Approved

## Problem

Google login is deliberately disabled in the Tauri desktop build
(`firebaseAuth.ts` → `isGoogleLoginSupported()` returns false under Tauri;
`signInWithGoogle()` short-circuits with "Google login is only available in
the browser build"). Firebase's `signInWithPopup` / `signInWithRedirect`
cannot work inside a Tauri webview: Google blocks OAuth in embedded webviews
(`disallowed_useragent`) and the `tauri://` origin is not an authorizable
domain.

## Goal

"Continue with Google" works in the desktop app with the same result as the
web build: a signed-in Firebase user, a Firestore profile via
`getOrCreateFirebaseUserProfile`, and the same admin-email permission logic.

## Approach: system browser + localhost loopback (OAuth PKCE)

The desktop app performs Google's documented "installed app" OAuth flow, then
bridges the resulting Google ID token into Firebase with
`signInWithCredential`.

### User experience

1. User clicks **Continue with Google** in the desktop app.
2. Their default browser opens Google's account chooser.
3. After sign-in, the browser shows a "you can close this tab" page.
4. The desktop app completes login automatically (same perms as web).

### Flow

1. Start a one-shot localhost HTTP server on a random port via
   `tauri-plugin-oauth`.
2. Generate PKCE `code_verifier` + S256 `code_challenge` and a random `state`.
3. Open the system browser (existing `tauri-plugin-opener`) at
   `https://accounts.google.com/o/oauth2/v2/auth` with:
   - `client_id` = desktop OAuth client ID
   - `redirect_uri` = `http://localhost:<port>`
   - `response_type=code`, `scope=openid email profile`
   - `code_challenge`, `code_challenge_method=S256`, `state`,
     `prompt=select_account`
4. Google redirects to the localhost port; the plugin emits the full redirect
   URL and the server shuts down.
5. Validate `state`; extract `code`.
6. Exchange the code at `https://oauth2.googleapis.com/token` (POST with
   `code_verifier`, client ID, client secret) using `tauri-plugin-http`'s
   fetch to avoid webview CORS restrictions.
7. Build `GoogleAuthProvider.credential(idToken)` from the returned
   `id_token` and call `signInWithCredential(auth, credential)`.
8. Reuse the existing `toLoginResult()` path (profile creation, admin
   perms, notes).

### Changes

**Rust (`src-tauri`):**
- Add `tauri-plugin-oauth` and `tauri-plugin-http` to `Cargo.toml`;
  register both in `lib.rs`.
- Add required permissions to `capabilities/default.json` (oauth start/cancel,
  `http:default` scoped to `https://oauth2.googleapis.com/*`).

**npm:** add the JS bindings `@fabianlars/tauri-plugin-oauth` and
`@tauri-apps/plugin-http`.

**`src/services/firebaseAuth.ts`:**
- New desktop branch in `signInWithGoogle()` implementing the flow above.
- `isGoogleLoginSupported()` in Tauri: true when Firebase config **and**
  `VITE_GOOGLE_DESKTOP_CLIENT_ID` are present.
- Pure helpers (exported for tests): build auth URL, parse/validate redirect
  URL (state check), parse token response.

**`src/components/LoginTab.tsx`:**
- Button enabled under Tauri when supported; loading label "Opening your
  browser..." during the flow; disabled-state tooltip updated to mention the
  missing desktop client ID env var when that is the cause.

**Config:**
- `VITE_GOOGLE_DESKTOP_CLIENT_ID`, `VITE_GOOGLE_DESKTOP_CLIENT_SECRET` env
  vars. For Google "Desktop app" OAuth clients the secret is explicitly
  non-confidential (Google's installed-app model), so embedding it in the
  binary is acceptable.

**Manual setup (user):** Google Cloud console → APIs & Services →
Credentials → Create OAuth client ID → type **Desktop app** → copy ID/secret
into `.env`.

## Error handling

- **User abandons browser:** 5-minute timeout cancels the oauth server and
  re-enables the button with a note.
- **`state` mismatch:** fail with a generic "Google login failed" note; never
  proceed with the code.
- **Token exchange / `signInWithCredential` failure:** surfaced through the
  existing `errorMessage()` → note UI.
- Repeated clicks while a flow is pending are ignored (existing
  `googleLoading` state).

## Testing

- Unit tests (Vitest, alongside existing `firebaseAuth.test.ts`) for the pure
  helpers: auth URL construction, redirect URL parsing, state validation,
  token response parsing.
- Full browser round-trip verified manually in the desktop build (cannot be
  automated: requires real Google account interaction).

## Out of scope

- Web build behavior (unchanged: popup with redirect fallback).
- Other providers, account linking, sign-out changes.
