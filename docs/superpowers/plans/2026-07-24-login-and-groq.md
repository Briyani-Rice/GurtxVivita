# Google Login Fix + Groq VIVI Bot Fallback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Google sign-in reliably succeed (or fail with an actionable message), and give the kiosk chatbot a Groq-backed LLM answer when the rule-based engine can't answer — without shipping the API key in the browser.

**Architecture:** Login stays Firebase Auth (popup→redirect on web). The fix makes the post-auth Firestore profile write non-fatal and improves error mapping. The chatbot keeps `answerMakerQuery` as the instant offline responder; on an `unknown` intent it calls a Firebase HTTPS Cloud Function that holds `GROQ_API_KEY` and proxies to Groq. Any failure degrades silently to the existing rule-based answer.

**Tech Stack:** React 19 + Vite + TypeScript, Firebase (Auth, Firestore, Functions 2nd gen on Blaze), Groq OpenAI-compatible API, tsx + node:assert tests.

## Global Constraints

- Tests use `tsx` + `node:assert/strict`, run via `npm run test` (finds `*.test.ts`/`*.test.tsx`). Copy the existing style.
- **Testable logic must NOT import `firebaseApp`** (or anything that instantiates Firebase at module load). Put pure logic in its own module; keep Firebase I/O thin.
- The Groq API key is **server-side only** — never referenced by any `src/` file or `VITE_` var.
- The chatbot must never appear broken when Groq/functions are unavailable: always fall back to the rule-based answer.
- Groq model: `llama-3.3-70b-versatile` (string constant, easy to change).
- Commit after every task. Conventional-commit messages, `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` footer.

---

## Part A — Google login

### Task 1: Make user-profile persistence non-fatal

If the post-auth Firestore write throws (rules deny, Firestore locked, offline), sign-in must still complete using the computed fallback perms instead of reporting failure.

**Files:**
- Create: `src/services/userProfile.ts` (pure profile builder — no Firebase import)
- Create: `src/services/userProfile.test.ts`
- Modify: `src/services/firebaseUsers.ts` (use the pure builder; wrap I/O so errors degrade)

**Interfaces:**
- Produces: `buildUserProfile(input: { uid: string; email: string | null; displayName: string | null }, existing: { username?: unknown; perms?: unknown }, fallbackPerms: UserPerms): FirebaseUserProfile`
- Produces: `permsFromValue(value: unknown): UserPerms`
- `FirebaseUserProfile` = `{ uid: string; email: string | null; username: string; perms: UserPerms }` (unchanged, re-exported from `userProfile.ts`)

- [ ] **Step 1: Write the failing test**

Create `src/services/userProfile.test.ts`:

```ts
import assert from "node:assert/strict";
import { buildUserProfile, permsFromValue } from "./userProfile.ts";
import { UserPerms } from "../types.ts";

// permsFromValue maps known staff markers to Staff, everything else to Basic.
assert.equal(permsFromValue("staff"), UserPerms.Staff);
assert.equal(permsFromValue("admin"), UserPerms.Staff);
assert.equal(permsFromValue(UserPerms.Staff), UserPerms.Staff);
assert.equal(permsFromValue("basic"), UserPerms.Basic);
assert.equal(permsFromValue(undefined), UserPerms.Basic);

// A fallback of Staff (email is on the admin list) always wins.
const adminProfile = buildUserProfile(
    { uid: "u1", email: "a@b.com", displayName: "Ada" },
    { perms: "basic" },
    UserPerms.Staff,
);
assert.equal(adminProfile.perms, UserPerms.Staff);
assert.equal(adminProfile.username, "Ada");

// A non-admin fallback keeps whatever perms the stored doc had.
const returningStaff = buildUserProfile(
    { uid: "u2", email: "c@d.com", displayName: null },
    { username: "StoredName", perms: "staff" },
    UserPerms.Basic,
);
assert.equal(returningStaff.perms, UserPerms.Staff);
assert.equal(returningStaff.username, "StoredName");

// Username falls back email -> "Google user" when nothing else is present.
const noName = buildUserProfile(
    { uid: "u3", email: null, displayName: null },
    {},
    UserPerms.Basic,
);
assert.equal(noName.username, "Google user");

console.log("userProfile tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/services/userProfile.test.ts`
Expected: FAIL — `Cannot find module './userProfile.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/userProfile.ts`:

```ts
import { UserPerms } from "../types";

export type FirebaseUserProfile = {
    uid: string;
    email: string | null;
    username: string;
    perms: UserPerms;
};

export function permsFromValue(value: unknown): UserPerms {
    if (value === UserPerms.Staff || value === "staff" || value === "admin") {
        return UserPerms.Staff;
    }

    return UserPerms.Basic;
}

export function buildUserProfile(
    input: { uid: string; email: string | null; displayName: string | null },
    existing: { username?: unknown; perms?: unknown },
    fallbackPerms: UserPerms,
): FirebaseUserProfile {
    return {
        uid: input.uid,
        email: input.email,
        username: String(existing.username ?? input.displayName ?? input.email ?? "Google user"),
        perms: fallbackPerms === UserPerms.Staff ? UserPerms.Staff : permsFromValue(existing.perms),
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/services/userProfile.test.ts`
Expected: PASS — prints `userProfile tests passed`.

- [ ] **Step 5: Rewrite `firebaseUsers.ts` to use the pure builder and degrade on error**

Replace the body of `src/services/firebaseUsers.ts` with:

```ts
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { UserPerms } from "../types";
import { getFirebaseApp, getFirebaseFirestore } from "./firebaseApp";
import { buildUserProfile, type FirebaseUserProfile } from "./userProfile";

export const USER_COLLECTION = "user";
export type { FirebaseUserProfile } from "./userProfile";

export async function getOrCreateFirebaseUserProfile(
    user: FirebaseUser,
    fallbackPerms: UserPerms,
): Promise<FirebaseUserProfile> {
    const input = { uid: user.uid, email: user.email, displayName: user.displayName };
    const app = getFirebaseApp();

    if (!app) {
        return buildUserProfile(input, {}, fallbackPerms);
    }

    // Persisting the profile is best-effort: if Firestore rules deny the write,
    // or the database is locked/unreachable, the user is still signed in with the
    // perms we computed. A profile-write failure must never fail the whole login.
    try {
        const db = getFirebaseFirestore();
        const ref = doc(db, USER_COLLECTION, user.uid);
        const snapshot = await getDoc(ref);
        const existing = snapshot.exists() ? snapshot.data() : {};
        const profile = buildUserProfile(input, existing, fallbackPerms);

        await setDoc(ref, {
            uid: profile.uid,
            email: profile.email,
            username: profile.username,
            perms: profile.perms === UserPerms.Staff ? "staff" : "basic",
            updatedAt: serverTimestamp(),
            ...(!snapshot.exists() ? { createdAt: serverTimestamp() } : {}),
        }, { merge: true });

        return profile;
    } catch (error) {
        console.warn("User profile persistence failed; continuing with computed perms.", error);
        return buildUserProfile(input, {}, fallbackPerms);
    }
}
```

- [ ] **Step 6: Run the full suite**

Run: `npm run test`
Expected: PASS (existing `firebaseUsers.test.ts` still green; new test green).

- [ ] **Step 7: Commit**

```bash
git add src/services/userProfile.ts src/services/userProfile.test.ts src/services/firebaseUsers.ts
git commit -m "fix: make Google-login profile persistence non-fatal

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Actionable error messages for common Google-auth failures

Cover the failure codes users actually hit (closed popup, cancelled request, network, and a deployed-domain hint for unauthorized-domain) so no raw `code: message` reaches the UI.

**Files:**
- Create: `src/services/googleAuthErrors.ts` (pure mapping — no Firebase import)
- Create: `src/services/googleAuthErrors.test.ts`
- Modify: `src/services/firebaseAuth.ts` (`errorMessage` delegates to the pure map)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `googleAuthErrorMessage(code: string | undefined, fallback: string): string`

- [ ] **Step 1: Write the failing test**

Create `src/services/googleAuthErrors.test.ts`:

```ts
import assert from "node:assert/strict";
import { googleAuthErrorMessage } from "./googleAuthErrors.ts";

assert.match(googleAuthErrorMessage("auth/configuration-not-found", "x"), /Enable Firebase Authentication/);
assert.match(googleAuthErrorMessage("auth/operation-not-allowed", "x"), /Google provider/);
assert.match(googleAuthErrorMessage("auth/unauthorized-domain", "x"), /Authorized domains/);
assert.match(googleAuthErrorMessage("auth/popup-closed-by-user", "x"), /closed/i);
assert.match(googleAuthErrorMessage("auth/cancelled-popup-request", "x"), /again/i);
assert.match(googleAuthErrorMessage("auth/network-request-failed", "x"), /network/i);

// Unknown code falls back to "code: fallback".
assert.equal(googleAuthErrorMessage("auth/weird", "boom"), "auth/weird: boom");
// No code returns the bare fallback.
assert.equal(googleAuthErrorMessage(undefined, "boom"), "boom");

console.log("googleAuthErrors tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/services/googleAuthErrors.test.ts`
Expected: FAIL — `Cannot find module './googleAuthErrors.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/googleAuthErrors.ts`:

```ts
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

export function googleAuthErrorMessage(code: string | undefined, fallback: string): string {
    if (code && MESSAGES[code]) {
        return MESSAGES[code];
    }

    return code ? `${code}: ${fallback}` : fallback;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/services/googleAuthErrors.test.ts`
Expected: PASS — prints `googleAuthErrors tests passed`.

- [ ] **Step 5: Delegate `errorMessage` in `firebaseAuth.ts` to the pure map**

In `src/services/firebaseAuth.ts`, add to the import block near the top (after the `googleDesktopOauth` import):

```ts
import { googleAuthErrorMessage } from "./googleAuthErrors";
```

Then replace the entire `errorMessage` function (currently lines ~120–137) with:

```ts
function errorMessage(error: unknown, fallback: string): string {
    const code = errorCode(error);
    const message = error instanceof Error ? error.message : fallback;

    return googleAuthErrorMessage(code, message);
}
```

- [ ] **Step 6: Run the full suite + typecheck**

Run: `npm run test && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/services/googleAuthErrors.ts src/services/googleAuthErrors.test.ts src/services/firebaseAuth.ts
git commit -m "fix: actionable messages for common Google sign-in errors

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Regression test — redirect fallback is progress, not an error (issue #16.1)

Lock in that a popup-blocked redirect returns `redirecting: true` so `LoginTab` shows it in green.

**Files:**
- Modify: `src/services/firebaseAuth.test.ts` (add a case; if the file imports `firebaseApp`, instead create `src/services/firebaseAuthResult.test.ts` per the next note)

**Note on the no-`firebaseApp` constraint:** `signInWithGoogle` imports `firebaseApp` transitively, so it cannot be unit-tested directly. Instead, assert the *contract* the UI relies on with a tiny pure helper.

**Interfaces:**
- Produces: `isProgressNote(result: { success: boolean; redirecting?: boolean }): boolean` in `src/services/googleAuthErrors.ts` (colocated; UI uses it via `firebaseAuth`).

- [ ] **Step 1: Write the failing test**

Create `src/services/loginNoteColor.test.ts`:

```ts
import assert from "node:assert/strict";
import { isProgressNote } from "./googleAuthErrors.ts";

// A redirect under way is progress: LoginTab should render it green, not red.
assert.equal(isProgressNote({ success: false, redirecting: true }), true);
// A real failure is not progress.
assert.equal(isProgressNote({ success: false }), false);
// Success is not a "progress" note (it takes the success path).
assert.equal(isProgressNote({ success: true }), false);

console.log("loginNoteColor tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/services/loginNoteColor.test.ts`
Expected: FAIL — `isProgressNote` is not exported.

- [ ] **Step 3: Add the helper**

Append to `src/services/googleAuthErrors.ts`:

```ts
export function isProgressNote(result: { success: boolean; redirecting?: boolean }): boolean {
    return !result.success && result.redirecting === true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/services/loginNoteColor.test.ts`
Expected: PASS.

- [ ] **Step 5: Use the helper in `LoginTab.tsx` (behaviour-preserving)**

In `src/components/LoginTab.tsx`, add this import below the existing `firebaseAuth` import block (`isProgressNote` lives in `googleAuthErrors`, not `firebaseAuth`):

```ts
import { isProgressNote } from "../services/googleAuthErrors";
```

Then in `handleGoogleLogin`, replace:

```ts
                setNoteIsSuccess(Boolean(res.redirecting));
```

with:

```ts
                setNoteIsSuccess(isProgressNote(res));
```

- [ ] **Step 6: Run suite + typecheck**

Run: `npm run test && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/services/googleAuthErrors.ts src/services/loginNoteColor.test.ts src/components/LoginTab.tsx
git commit -m "fix: show Google redirect fallback as progress not error (#16.1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Login troubleshooting guide (the Console-config fix)

If sign-in still fails after Tasks 1–3, the cause is Firebase Console config. Document the exact click-path.

**Files:**
- Create: `docs/google-login-setup.md`
- Modify: `README.md` (link to it from the auth section)

- [ ] **Step 1: Write the guide**

Create `docs/google-login-setup.md`:

```markdown
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
```

- [ ] **Step 2: Link it from the README**

In `README.md`, find the authentication/Google-login section and add a line:

```markdown
See [docs/google-login-setup.md](docs/google-login-setup.md) for Google sign-in setup and troubleshooting.
```

If no such section exists, add a short "## Google sign-in" section containing that line.

- [ ] **Step 3: Commit**

```bash
git add docs/google-login-setup.md README.md
git commit -m "docs: Google sign-in setup and troubleshooting guide

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Part B — Groq-backed VIVI Bot fallback

### Task 5: Groq function project + pure request/response helpers

Scaffold the Functions project and the pure logic (system prompt + request body + reply parsing) that can be tested without any network or Firebase.

**Files:**
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`
- Create: `functions/src/groqPrompt.ts` (pure)
- Create: `functions/src/groqPrompt.test.ts`

**Interfaces:**
- Produces: `GROQ_MODEL: string`
- Produces: `buildGroqRequestBody(query: string): { model: string; messages: { role: string; content: string }[]; max_tokens: number; temperature: number }`
- Produces: `parseGroqReply(json: unknown): string | null`
- Produces: `sanitizeQuery(raw: unknown): string | null` (trims; rejects empty or >500 chars → null)

- [ ] **Step 1: Write the failing test**

Create `functions/src/groqPrompt.test.ts`:

```ts
import assert from "node:assert/strict";
import { buildGroqRequestBody, parseGroqReply, sanitizeQuery, GROQ_MODEL } from "./groqPrompt.ts";

// sanitizeQuery trims and rejects empty / oversized input.
assert.equal(sanitizeQuery("  hi  "), "hi");
assert.equal(sanitizeQuery(""), null);
assert.equal(sanitizeQuery("   "), null);
assert.equal(sanitizeQuery(123), null);
assert.equal(sanitizeQuery("x".repeat(501)), null);

// Request body carries a safety-aware system prompt and the user's query.
const body = buildGroqRequestBody("Can I bake a cake here?");
assert.equal(body.model, GROQ_MODEL);
assert.equal(body.messages[0].role, "system");
assert.match(body.messages[0].content, /VIVITA|makerspace/i);
assert.match(body.messages[0].content, /safe|adult/i);
assert.equal(body.messages[1].role, "user");
assert.equal(body.messages[1].content, "Can I bake a cake here?");

// parseGroqReply extracts the assistant text, or null on a malformed shape.
assert.equal(
    parseGroqReply({ choices: [{ message: { content: "Try a cardboard oven model!" } }] }),
    "Try a cardboard oven model!",
);
assert.equal(parseGroqReply({ choices: [] }), null);
assert.equal(parseGroqReply({}), null);
assert.equal(parseGroqReply(null), null);

console.log("groqPrompt tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx functions/src/groqPrompt.test.ts`
Expected: FAIL — `Cannot find module './groqPrompt.ts'`.

- [ ] **Step 3: Write the pure module**

Create `functions/src/groqPrompt.ts`:

```ts
export const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = [
    "You are VIVI Bot, a friendly assistant for children in a VIVITA makerspace.",
    "Answer in 2-4 short, encouraging sentences a 8-12 year old can read.",
    "Only discuss making, crafting, tools, materials, and project ideas available in a makerspace.",
    "Always keep it safe: for anything with heat, blades, or electricity, remind them to ask an adult or staff member for help.",
    "If a request is unsafe or unrelated to making things, gently redirect them to ask a staff member.",
].join(" ");

export function sanitizeQuery(raw: unknown): string | null {
    if (typeof raw !== "string") {
        return null;
    }

    const trimmed = raw.trim();
    if (trimmed.length === 0 || trimmed.length > 500) {
        return null;
    }

    return trimmed;
}

export function buildGroqRequestBody(query: string) {
    return {
        model: GROQ_MODEL,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: query },
        ],
        max_tokens: 250,
        temperature: 0.6,
    };
}

export function parseGroqReply(json: unknown): string | null {
    if (typeof json !== "object" || json === null) {
        return null;
    }

    const choices = (json as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || choices.length === 0) {
        return null;
    }

    const content = (choices[0] as { message?: { content?: unknown } })?.message?.content;
    return typeof content === "string" && content.trim().length > 0 ? content.trim() : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx functions/src/groqPrompt.test.ts`
Expected: PASS — prints `groqPrompt tests passed`.

- [ ] **Step 5: Add the Functions project files**

Create `functions/package.json`:

```json
{
  "name": "functions",
  "type": "module",
  "engines": { "node": "20" },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "dependencies": {
    "firebase-functions": "^6.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

Create `functions/tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "outDir": "lib",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 6: Commit**

```bash
git add functions/package.json functions/tsconfig.json functions/src/groqPrompt.ts functions/src/groqPrompt.test.ts
git commit -m "feat(functions): Groq prompt/response helpers + project scaffold

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: The `makerAssistant` HTTPS function

Thin handler: CORS, validate input, call Groq with the server-side key, return `{ reply }`.

**Files:**
- Create: `functions/src/index.ts`

**Interfaces:**
- Consumes: `sanitizeQuery`, `buildGroqRequestBody`, `parseGroqReply` from `./groqPrompt`.
- Produces (HTTP): `POST` JSON `{ query: string }` → `200 { reply: string }` | `400 { error }` | `502 { error }`. Reads `GROQ_API_KEY` from the environment / secret.

- [ ] **Step 1: Write the handler**

Create `functions/src/index.ts`:

```ts
import { onRequest } from "firebase-functions/v2/https";
import { buildGroqRequestBody, parseGroqReply, sanitizeQuery } from "./groqPrompt.js";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const makerAssistant = onRequest(
    { secrets: ["GROQ_API_KEY"], cors: true, timeoutSeconds: 20, maxInstances: 5 },
    async (req, res) => {
        if (req.method !== "POST") {
            res.status(405).json({ error: "Use POST." });
            return;
        }

        const query = sanitizeQuery(req.body?.query);
        if (!query) {
            res.status(400).json({ error: "Provide a non-empty query under 500 characters." });
            return;
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            res.status(502).json({ error: "Assistant is not configured." });
            return;
        }

        try {
            const groqRes = await fetch(GROQ_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(buildGroqRequestBody(query)),
            });

            const reply = parseGroqReply(await groqRes.json().catch(() => null));
            if (!groqRes.ok || !reply) {
                res.status(502).json({ error: "The assistant could not answer right now." });
                return;
            }

            res.status(200).json({ reply });
        } catch {
            res.status(502).json({ error: "The assistant could not answer right now." });
        }
    },
);
```

- [ ] **Step 2: Typecheck the functions build**

Run: `cd functions && npm install && npm run build && cd ..`
Expected: `tsc` compiles with no errors (produces `functions/lib/`).

Note: `functions/lib/` is build output — ensure it is git-ignored (Step 3).

- [ ] **Step 3: Ignore build output**

Append to `.gitignore` (if not already present):

```
functions/lib/
functions/node_modules/
```

- [ ] **Step 4: Commit**

```bash
git add functions/src/index.ts .gitignore
git commit -m "feat(functions): makerAssistant HTTPS Groq proxy

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Client fallback module `makerAssistantGroq.ts`

Pure, injectable client that calls the function URL with a hard timeout and returns `null` on any problem so the caller degrades gracefully.

**Files:**
- Create: `src/services/makerAssistantGroq.ts` (no `firebaseApp` import)
- Create: `src/services/makerAssistantGroq.test.ts`

**Interfaces:**
- Produces: `askGroqFallback(query: string, opts?: { url?: string; fetchImpl?: typeof fetch; timeoutMs?: number }): Promise<string | null>`
- Default `url` = `import.meta.env.VITE_MAKER_ASSISTANT_URL`; default `timeoutMs` = 8000.

- [ ] **Step 1: Write the failing test**

Create `src/services/makerAssistantGroq.test.ts`:

```ts
import assert from "node:assert/strict";
import { askGroqFallback } from "./makerAssistantGroq.ts";

const url = "https://example.test/makerAssistant";

function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

// Happy path: returns the reply string.
const okReply = await askGroqFallback("bake a cake?", {
    url,
    fetchImpl: async () => jsonResponse(200, { reply: "Try building a cardboard oven!" }),
});
assert.equal(okReply, "Try building a cardboard oven!");

// Non-OK response -> null.
const errReply = await askGroqFallback("bake a cake?", {
    url,
    fetchImpl: async () => jsonResponse(502, { error: "nope" }),
});
assert.equal(errReply, null);

// Thrown fetch -> null.
const thrownReply = await askGroqFallback("bake a cake?", {
    url,
    fetchImpl: async () => { throw new Error("network down"); },
});
assert.equal(thrownReply, null);

// Missing url -> null (no network attempted).
const noUrlReply = await askGroqFallback("bake a cake?", {
    url: "",
    fetchImpl: async () => { throw new Error("should not be called"); },
});
assert.equal(noUrlReply, null);

// Empty query -> null.
const emptyReply = await askGroqFallback("   ", { url, fetchImpl: async () => jsonResponse(200, { reply: "x" }) });
assert.equal(emptyReply, null);

console.log("makerAssistantGroq tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/services/makerAssistantGroq.test.ts`
Expected: FAIL — `Cannot find module './makerAssistantGroq.ts'`.

- [ ] **Step 3: Write the implementation**

Create `src/services/makerAssistantGroq.ts`:

```ts
type AskOptions = {
    url?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
};

function defaultUrl(): string {
    return String((import.meta.env.VITE_MAKER_ASSISTANT_URL as string | undefined) ?? "").trim();
}

// Calls the makerAssistant Cloud Function. Returns the reply on success, or null
// on any problem (unconfigured URL, timeout, network error, bad response) so the
// caller can fall back to the rule-based answer without special-casing failures.
export async function askGroqFallback(query: string, opts: AskOptions = {}): Promise<string | null> {
    const trimmed = query.trim();
    const url = (opts.url ?? defaultUrl()).trim();
    const fetchImpl = opts.fetchImpl ?? fetch;
    const timeoutMs = opts.timeoutMs ?? 8000;

    if (!trimmed || !url) {
        return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetchImpl(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: trimmed }),
            signal: controller.signal,
        });

        if (!res.ok) {
            return null;
        }

        const data = (await res.json().catch(() => null)) as { reply?: unknown } | null;
        const reply = data?.reply;
        return typeof reply === "string" && reply.trim().length > 0 ? reply.trim() : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/services/makerAssistantGroq.test.ts`
Expected: PASS — prints `makerAssistantGroq tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/services/makerAssistantGroq.ts src/services/makerAssistantGroq.test.ts
git commit -m "feat: client Groq fallback with timeout and graceful degradation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Wire the Groq fallback into `MakerKiosk`

Rule-based hits stay synchronous. On an `unknown` intent, show a "thinking" bubble, await Groq, and replace it — or keep the rule-based answer if Groq returns null.

**Files:**
- Modify: `src/components/MakerKiosk.tsx` (`ask` function, ~lines 407–419; and the `ChatMessage` render already handles plain `text`)

**Interfaces:**
- Consumes: `askGroqFallback` from `../services/makerAssistantGroq`.
- Consumes: existing `answerMakerQuery`, `makeId`, `ChatMessage`.

- [ ] **Step 1: Add the import**

In `src/components/MakerKiosk.tsx`, near the other `../services` / `../components` imports, add:

```ts
import { askGroqFallback } from "../services/makerAssistantGroq";
```

- [ ] **Step 2: Replace the `ask` function**

Replace the existing `ask` (the `const ask = (prompt: string) => { ... }` block) with:

```ts
    const ask = (prompt: string) => {
        const query = prompt.trim();
        if (!query) return;

        const answer = answerMakerQuery(query, makerItems, projectIdeas);
        const childId = makeId();
        const assistantId = makeId();

        setMessages(prev => [
            ...prev,
            { id: childId, role: "child", text: query },
            { id: assistantId, role: "assistant", text: answer.title, answer },
        ]);
        setInput("");

        // The rule-based engine answered directly; nothing more to do.
        if (answer.intent !== "unknown") {
            return;
        }

        // No confident local answer — show a thinking state and try Groq. If Groq
        // is unavailable it returns null and we keep the rule-based fallback bubble.
        setMessages(prev =>
            prev.map(m => (m.id === assistantId
                ? { id: m.id, role: "assistant", text: "VIVI Bot is thinking…" }
                : m)),
        );

        askGroqFallback(query).then(reply => {
            setMessages(prev =>
                prev.map(m => {
                    if (m.id !== assistantId) return m;
                    return reply
                        ? { id: m.id, role: "assistant", text: reply }
                        : { id: m.id, role: "assistant", text: answer.title, answer };
                }),
            );
        });
    };
```

- [ ] **Step 3: Typecheck + build + suite**

Run: `npx tsc --noEmit && npm run test`
Expected: PASS, no type errors. (`ChatMessage.answer` is optional, so the thinking/plain-text bubbles are valid.)

- [ ] **Step 4: Manual smoke (optional but recommended)**

Run: `npm run dev`, open the kiosk (`?display=kiosk`), ask "Where is cardboard?" (instant rule-based answer) and "Can I bake a cake here?" (shows "VIVI Bot is thinking…", then either a Groq reply if `VITE_MAKER_ASSISTANT_URL` is set, or the "Ask a staff member" fallback if not).

- [ ] **Step 5: Commit**

```bash
git add src/components/MakerKiosk.tsx
git commit -m "feat: VIVI Bot falls back to Groq for unknown questions

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Config wiring + Groq setup docs

Register functions in `firebase.json`, add the env var, and document key setup + deploy.

**Files:**
- Modify: `firebase.json` (add `functions` block)
- Modify: `.env.example` (add `VITE_MAKER_ASSISTANT_URL`)
- Create: `docs/groq-chatbot-setup.md`
- Modify: `README.md` (link the guide)

- [ ] **Step 1: Add functions to `firebase.json`**

Replace `firebase.json` with:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

- [ ] **Step 2: Add the env var to `.env.example`**

Append to `.env.example`:

```
# URL of the deployed makerAssistant Cloud Function (Groq proxy). Leave blank to
# keep the chatbot fully rule-based. Example:
# https://us-central1-<project-id>.cloudfunctions.net/makerAssistant
VITE_MAKER_ASSISTANT_URL=
```

- [ ] **Step 3: Write the setup guide**

Create `docs/groq-chatbot-setup.md`:

```markdown
# Groq chatbot (VIVI Bot) setup

VIVI Bot answers instantly from the built-in rule-based engine. For questions it
can't answer, it calls a Firebase Cloud Function that proxies to Groq. The Groq API
key lives only in the function — never in the browser bundle.

## 1. Get a Groq API key
Sign up at https://console.groq.com and create an API key (free tier available).

## 2. Store the key as a function secret
```bash
firebase functions:secrets:set GROQ_API_KEY
# paste the key when prompted
```

## 3. Deploy the function (requires the Blaze plan)
```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
```
Copy the printed URL, e.g. `https://us-central1-<project-id>.cloudfunctions.net/makerAssistant`.

## 4. Point the app at the function
Put the URL in `.env.local`:
```
VITE_MAKER_ASSISTANT_URL=https://us-central1-<project-id>.cloudfunctions.net/makerAssistant
```
Rebuild/redeploy hosting. If left blank, the chatbot stays fully rule-based — nothing breaks.

## Local testing
`cd functions && GROQ_API_KEY=... npm run serve` runs the emulator; point
`VITE_MAKER_ASSISTANT_URL` at the emulator URL it prints.
```

- [ ] **Step 4: Link it from the README**

In `README.md`, add under the features/chatbot section:

```markdown
See [docs/groq-chatbot-setup.md](docs/groq-chatbot-setup.md) to enable the Groq-backed chatbot fallback.
```

- [ ] **Step 5: Final full verification**

Run: `npm run test && npm run lint && npm run build`
Expected: all PASS; `dist/` builds cleanly.

- [ ] **Step 6: Commit**

```bash
git add firebase.json .env.example docs/groq-chatbot-setup.md README.md
git commit -m "chore: wire functions config + Groq chatbot setup docs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-review notes (author)

- **Spec coverage:** Part A → Tasks 1 (non-fatal profile, the likely real bug), 2 (error mapping), 3 (#16.1 redirect-green), 4 (Console guide). Part B → Tasks 5–6 (function + pure helpers), 7 (client fallback), 8 (MakerKiosk wiring), 9 (config + docs + graceful-degradation via null). All spec sections mapped.
- **Type consistency:** `askGroqFallback(query, opts)` signature identical in Tasks 7 & 8. `buildUserProfile`/`permsFromValue` names identical in Tasks 1. `parseGroqReply`/`buildGroqRequestBody`/`sanitizeQuery` identical in Tasks 5 & 6. `googleAuthErrorMessage`/`isProgressNote` identical in Tasks 2 & 3.
- **No-`firebaseApp` constraint honored:** all `*.test.ts` import only pure modules (`userProfile`, `googleAuthErrors`, `groqPrompt`, `makerAssistantGroq`), never `firebaseAuth`/`firebaseUsers`/`firebaseApp`.
- **Deferred (not in this plan):** issues #10, #14, #16 items 2–7.
```
