# Design: Google login fix + Groq-backed VIVI Bot fallback

Date: 2026-07-24
Branch base: `security/firestore-rules`
Priority (per user): login + Groq first; issues #10/#14/#16 deferred to a later pass.

## Goal

1. Make Google sign-in reliably work (or fail with an actionable message) on the
   deployed web app.
2. Give the kiosk chatbot ("VIVI Bot") a real LLM answer via **Groq** when the
   existing rule-based engine cannot answer — without shipping the API key in the
   browser bundle.

## Non-goals (this pass)

- Issue #10 (server-side admin gating / custom claims), #14 (dead code + README),
  #16 items 2–7. Explicitly out of scope now.
- Replacing the rule-based engine. It stays as the instant, offline-safe first
  responder; Groq is only a fallback.

---

## Part A — Google login

### Findings from code review
- The web flow (`src/services/firebaseAuth.ts` `signInWithGoogle`) is correct:
  `signInWithPopup`, falling back to `signInWithRedirect` on `auth/popup-blocked`,
  with a `redirecting: true` flag so the in-progress state is not shown as an error.
- The redirect result **is** consumed and acted on in `src/app.tsx:637`
  (`consumeGoogleRedirectResult`) — adds the correct tab and records the session.
- Firebase env vars are set in `.env.local`, so `isGoogleLoginSupported()` returns
  true on web and the button is enabled.

Conclusion: the most likely cause of "Google login doesn't work" on the live site
is **Firebase Console configuration**, not application code:
- `gurtxvivita-4c370.web.app` missing from **Firebase Auth → Settings → Authorized
  domains** → `auth/unauthorized-domain`.
- Google provider not enabled → `auth/configuration-not-found` /
  `auth/operation-not-allowed`.

### Work
1. **Reproduce**: run the dev server, trigger sign-in, capture the exact error code
   from the returned note / console. Confirm which of the above (or something else).
2. **Harden error surfacing** in `firebaseAuth.ts`:
   - Ensure every failure path returns a specific, actionable `note` (close any gap
     where a raw `code: message` leaks through without guidance).
   - Add an explicit hint for `auth/unauthorized-domain` that names the deployed
     domain and the Console path to fix it.
3. **Verify issue #16 item 1** (same file): a blocked-popup redirect must render in
   green, not red. `LoginTab` already keys color off `res.redirecting`
   (`setNoteIsSuccess(Boolean(res.redirecting))`); confirm with a test.
4. **Console fix guide**: write the exact click-path (enable Google provider + add
   authorized domains) into the README / a short doc, since the actual fix — if it
   is config — lives in the Console, not the code.

### Tests
- Unit test asserting `signInWithGoogle`'s redirect branch returns
  `{ success: false, redirecting: true }` (so UI shows green).
- Unit test that an `auth/unauthorized-domain` error maps to the actionable message.
- Keep to tsx/node-assert; do not import `firebaseApp` (mock the auth surface).

---

## Part B — Groq-backed fallback for VIVI Bot

### Architecture
```
MakerKiosk.ask(query)
  -> answerMakerQuery(query)          // existing, synchronous, offline-safe
       intent !== "unknown"  -> render immediately (unchanged)
       intent === "unknown"  -> askGroqFallback(query)   // async
                                   |
                                   v
                       Firebase Cloud Function (functions/)
                         holds GROQ_API_KEY (server-side only)
                         POST https://api.groq.com/openai/v1/chat/completions
                                   |
                                   v
                         { reply } -> assistant bubble
```

The Groq API key is **never** in the client bundle. The browser only knows the
Cloud Function URL. Blaze plan is available (confirmed), so we use Firebase Functions.

### New / changed files
- `functions/` — Firebase Functions project (2nd gen, Node). One callable/HTTPS
  function `makerAssistant` that:
  - reads `GROQ_API_KEY` from function config/secret,
  - accepts `{ query: string }`,
  - calls Groq `chat/completions` with model `llama-3.3-70b-versatile` (configurable),
  - returns `{ reply: string }`,
  - enforces a max token / timeout budget and a kid-safe **system prompt**
    (VIVITA makerspace context, age-appropriate tone, adult-supervision reminder
    for tools, no unsafe instructions),
  - rejects empty/oversized input.
- `src/services/makerAssistantGroq.ts` — pure client module:
  - `askGroqFallback(query): Promise<string | null>`,
  - hard client-side timeout (e.g. 8s); on any error/timeout/unreachable returns
    `null` so the caller degrades gracefully,
  - reads the function URL from `import.meta.env.VITE_MAKER_ASSISTANT_URL`.
- `src/components/MakerKiosk.tsx` — `ask()` becomes async only on the fallback
  branch: push a "VIVI Bot is thinking…" placeholder, await `askGroqFallback`;
  on a string, replace with the Groq reply; on `null`, keep the current rule-based
  "ask a staff member" answer. Rule-based hits stay fully synchronous.
- `.env.example` — add `VITE_MAKER_ASSISTANT_URL=`.
- `firebase.json` — add a `functions` block.

### Graceful degradation (hard requirement)
If the function is unconfigured, unreachable, times out, or errors, the kiosk shows
the existing rule-based fallback answer. The chatbot must never appear broken when
Groq/functions are unavailable.

### Tests (tsx/node-assert)
- `makerAssistantGroq.test.ts`: returns `null` on non-OK response, on timeout, and
  when `VITE_MAKER_ASSISTANT_URL` is unset; returns the reply string on a well-formed
  response. Fetch is injected/mocked; no network, no `firebaseApp` import.
- A small unit test for the function's request-body builder / system-prompt assembly
  if that logic is factored into a pure helper (keep Groq HTTP call thin).

### Setup left to the user (documented, with placeholders)
- Get a free key at `console.groq.com`.
- `firebase functions:secrets:set GROQ_API_KEY` (or `.env` for local emulator).
- Deploy the function; put its URL into `VITE_MAKER_ASSISTANT_URL`.

---

## Rollout / verification
- `npm run test`, `npm run lint`, `npm run build` all green.
- Manual: rule-based queries answer instantly; an out-of-scope query
  ("can I bake a cake here?") returns a friendly Groq answer when the function is
  configured, and the rule-based fallback when it is not.
