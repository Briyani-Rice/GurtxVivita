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
