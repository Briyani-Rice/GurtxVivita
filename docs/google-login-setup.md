# Google sign-in setup & troubleshooting

The app code (popup → redirect fallback → redirect-result consumption) is verified.
When "Google login doesn't work" in a browser, it is almost always Firebase Console
configuration. Fix in this order:

## 1. Enable the Google provider
Firebase Console → **Authentication** → **Sign-in method** → **Add new provider** →
**Google** → Enable → Save.
- Symptom if missing: `auth/configuration-not-found` or `auth/operation-not-allowed`.

## 2. Authorize the domains
Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add:
- `localhost`
- `127.0.0.1`
- `gurtxvivita-4c370.web.app` (the deployed site)
- any custom domain you serve from
- Symptom if missing: `auth/unauthorized-domain`.

## 3. Confirm the env vars
`.env.local` must have the `VITE_FIREBASE_*` values from Firebase Console →
Project settings → Your apps → SDK setup. Rebuild after changing them.

## 4. Firestore is not required for sign-in to succeed
Profile persistence is best-effort — a denied/locked Firestore write logs a warning
but no longer fails the login. Deploy `firestore.rules` (`firebase deploy --only
firestore:rules`) so signed-in users can persist their own `user/{uid}` profile.

## 5. Popups
If a popup is blocked, the app automatically falls back to a full-page redirect and
shows "Redirecting to Google sign-in…" (green). That is expected, not an error.

## 6. Tauri desktop login

Google blocks OAuth inside embedded desktop webviews, so the Tauri app opens the
system browser and receives the result on a temporary loopback address.

1. Open Google Cloud Console → **Google Auth Platform** → **Clients** for the same
   project as Firebase.
2. Create a client with application type **Desktop app**.
3. Add its client ID to `.env.local`:

   ```text
   VITE_GOOGLE_DESKTOP_CLIENT_ID=...apps.googleusercontent.com
   ```

4. Rebuild or restart the desktop app.

The desktop flow uses PKCE, but Google still requires `client_secret` when a **Desktop
app** client exchanges the authorization code — omitting it fails with
`Google token exchange failed: client_secret is missing.` Copy the client secret from
the same Console page and set it too:

```text
VITE_GOOGLE_DESKTOP_CLIENT_SECRET=...
```

Google documents this value as non-confidential for installed apps (it ships inside the
app bundle and cannot be kept private), so it is not treated as a password. PKCE is what
actually protects the exchange.
