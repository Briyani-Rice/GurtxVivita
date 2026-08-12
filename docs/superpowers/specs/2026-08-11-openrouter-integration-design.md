# OpenRouter integration — design

**Date:** 2026-08-11
**Status:** Approved

## Goal

Replace Groq with [OpenRouter](https://openrouter.ai/) as the sole LLM provider across
both AI paths in the app. Use free-tier models only.

## Background

Two independent AI paths existed, both on Groq:

1. **VIVI Bot chat panel** (`src/components/Chatbot/ChatBotView.tsx`) — full chat UI with a
   model picker, calling Groq directly from the browser with a key from the gitignored
   `src/Secrets.ts`. Supports admin actions (add/edit/delete materials).
2. **Maker kiosk fallback** (`src/services/makerAssistantGroq.ts` → Firebase Function
   `makerAssistant`) — a rule-based engine answers instantly; unanswered questions fall
   back to Groq. The key stays server-side as a Firebase secret.

OpenRouter's chat-completions API is OpenAI-compatible — the same request and response
shape Groq uses — so both call sites change endpoint, key, and model IDs while the
request-building and reply-parsing logic keeps its structure.

## Decisions

| Decision | Choice |
|---|---|
| Scope | Both the chat panel and the kiosk Cloud Function |
| Provider | OpenRouter replaces Groq entirely |
| Key handling | Unchanged from today: browser bundle (`Secrets.ts`) for the panel, Firebase secret for the function |
| Model list | Curated static array in code |
| Cost tier | Free models only (`:free` IDs) |

## Architecture

```
Chat panel   ChatBotView.tsx ──► openrouter.ai/api/v1/chat/completions
                                  (OPENROUTER_API_KEY from src/Secrets.ts, browser)

Kiosk        MakerKiosk.tsx ──► rule engine (instant)
                    └─ miss ──► makerAssistantClient.ts
                                 └─► Firebase fn makerAssistant
                                      └─► openrouter.ai/api/v1/chat/completions
                                           (OPENROUTER_API_KEY secret, server)
```

## Components

### 1. Chat panel — `src/components/Chatbot/ChatBotView.tsx`

Free-only curated model list (all verified present on OpenRouter on 2026-08-11):

```ts
const MODELS = [
  { id: "openai/gpt-oss-20b:free",                label: "GPT-OSS 20B",   note: "Fast · Recommended" },
  { id: "google/gemma-4-26b-a4b-it:free",         label: "Gemma 4 26B",   note: "Balanced"           },
  { id: "google/gemma-4-31b-it:free",             label: "Gemma 4 31B",   note: "Reliable"           },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free",    label: "Nemotron Nano", note: "Fast · Long context"},
  { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron 120B", note: "Powerful · Slower"  },
];
```

The picker UI is driven entirely off this array and needs no changes.

`callGroq` → `callOpenRouter`: new endpoint, `OPENROUTER_API_KEY` import, plus OpenRouter
attribution headers (`HTTP-Referer`, `X-Title: Viventory`).

`parseGroqError` → `parseOpenRouterError`, adding a **402** case (out of credits / daily
free cap) that Groq never returned, and treating a missing key as its own message rather
than letting it surface as a bare 401.

Admin action extraction, markdown rendering, and the system prompt are unchanged.

### 2. Cloud Function — `functions/src/index.ts`, `functions/src/assistantPrompt.ts`

- Endpoint constant → `https://openrouter.ai/api/v1/chat/completions`
- Secret `GROQ_API_KEY` → `OPENROUTER_API_KEY`
- Model → `openai/gpt-oss-20b:free`
- Attribution headers added alongside `Authorization`

`sanitizeQuery` (500-character cap), the safety-aware system prompt, and the reply parser
are unchanged — the response shape is identical.

### 3. Renaming

Groq-named symbols would be misleading once Groq is gone. Provider-neutral renames:

| Before | After |
|---|---|
| `src/services/makerAssistantGroq.ts` | `src/services/makerAssistantClient.ts` |
| `askGroqFallback` | `askAssistantFallback` |
| `functions/src/groqPrompt.ts` | `functions/src/assistantPrompt.ts` |
| `buildGroqRequestBody` | `buildAssistantRequestBody` |
| `parseGroqReply` | `parseAssistantReply` |
| `GROQ_MODEL` | `ASSISTANT_MODEL` |

Import sites: `src/components/MakerKiosk.tsx` and `functions/src/index.ts`.

## Error handling

| Condition | Behaviour |
|---|---|
| Missing/empty API key | Panel shows a setup message naming `src/Secrets.ts`; function returns 502 "not configured" |
| 401 | "Invalid API key" naming `OPENROUTER_API_KEY` |
| 402 | "Daily free-model limit reached" — explains credits lift the cap |
| 429 | "Rate limit reached — wait a moment" |
| 503 / network | "Temporarily unavailable" |
| Kiosk fallback, any failure | Returns `null`; the rule-based answer is shown. No user-visible error. |

## Testing

Both existing test files move with their subjects and keep their coverage. They inject
`fetchImpl` / operate on pure functions, so no network is touched:

- `src/services/makerAssistantClient.test.ts` — happy path, non-OK, malformed body,
  unconfigured URL, timeout.
- `functions/src/assistantPrompt.test.ts` — query sanitising, request body shape and
  model ID, reply parsing and malformed shapes.

`npm test` runs the `src` tests. The `functions` tests run via `tsx` directly.

## Known constraint: free-tier limits

OpenRouter `:free` models are capped at **20 requests/minute** and **50 requests/day**,
rising to **1,000/day** once at least 10 credits have been purchased on the account.

For the kiosk this degrades gracefully — the rule-based engine absorbs most traffic and a
fallback failure is invisible. The chat panel will hit the cap on a busy day; the 402/429
messages say so plainly. Purchasing $10 of credits lifts the cap with no code change.

## Out of scope

- Dynamic model fetching from `/api/v1/models`
- Paid models
- Moving the chat panel's key server-side
- Streaming responses
