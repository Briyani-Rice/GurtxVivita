# OpenRouter chatbot setup

The app uses [OpenRouter](https://openrouter.ai/) for both AI features. OpenRouter's API
is OpenAI-compatible and routes to hundreds of models; this app is pinned to **free-tier
models only** (IDs ending in `:free`).

There are two independent paths, each with its own key:

| Path | Where the key lives |
|---|---|
| **VIVI Bot chat panel** — full chat UI with model picker | `src/Secrets.ts` (browser bundle) |
| **Maker kiosk fallback** — rule engine first, AI for the rest | Firebase function secret (server-side) |

## 1. Get an OpenRouter API key

Sign up at https://openrouter.ai and create a key at https://openrouter.ai/keys.
A free account is enough for the `:free` models this app uses.

## 2. Chat panel — put the key in `src/Secrets.ts`

```bash
cp src/Secrets.example.ts src/Secrets.ts
```

Then edit it:

```ts
export const OPENROUTER_API_KEY = "sk-or-v1-...";
```

`src/Secrets.ts` is gitignored. If the key is left empty the chat panel still loads and
shows a clear setup message instead of failing silently.

> **Note:** this key ships inside the browser bundle. That's fine for local and internal
> use, but anyone with access to a deployed build can extract it. Keep the account on
> free models so a leaked key can't spend real money.

## 3. Kiosk fallback — store the key as a function secret

```bash
firebase functions:secrets:set OPENROUTER_API_KEY
# paste the key when prompted
```

## 4. Deploy the function (requires the Blaze plan)

```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
```

Copy the printed URL, e.g. `https://us-central1-<project-id>.cloudfunctions.net/makerAssistant`.

## 5. Point the app at the function

Put the URL in `.env.local`:

```
VITE_MAKER_ASSISTANT_URL=https://us-central1-<project-id>.cloudfunctions.net/makerAssistant
```

Rebuild/redeploy hosting. If left blank, the kiosk stays fully rule-based — nothing breaks.

## Free-tier rate limits

`:free` models are capped at:

| Credits purchased on the account | Requests/minute | Requests/day |
|---|---|---|
| Under 10 | 20 | **50** |
| 10 or more | 20 | **1,000** |

The kiosk degrades gracefully — the rule-based engine answers most questions instantly and
a fallback failure is invisible to the user. The chat panel surfaces a plain message when
the cap is hit. Buying $10 of credits once lifts the daily cap to 1,000 with no code change.

## Changing models

The chat panel's picker is a static list in `src/components/Chatbot/ChatBotView.tsx`
(`MODELS`). The kiosk function's model is `ASSISTANT_MODEL` in
`functions/src/assistantPrompt.ts`. Browse available IDs at https://openrouter.ai/models
or `curl https://openrouter.ai/api/v1/models`.

## Local testing

`cd functions && OPENROUTER_API_KEY=... npm run serve` runs the emulator; point
`VITE_MAKER_ASSISTANT_URL` at the emulator URL it prints.
