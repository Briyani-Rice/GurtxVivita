import { onRequest } from "firebase-functions/v2/https";
import { buildAssistantRequestBody, parseAssistantReply, sanitizeQuery } from "./assistantPrompt.js";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export const makerAssistant = onRequest(
    { secrets: ["OPENROUTER_API_KEY"], cors: true, timeoutSeconds: 20, maxInstances: 5 },
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

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            res.status(502).json({ error: "Assistant is not configured." });
            return;
        }

        try {
            const openRouterRes = await fetch(OPENROUTER_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                    // OpenRouter uses these to attribute traffic to the app.
                    "HTTP-Referer": "https://gurtxvivita-4c370.web.app",
                    "X-Title": "Viventory",
                },
                body: JSON.stringify(buildAssistantRequestBody(query)),
            });

            const reply = parseAssistantReply(await openRouterRes.json().catch(() => null));
            if (!openRouterRes.ok || !reply) {
                res.status(502).json({ error: "The assistant could not answer right now." });
                return;
            }

            res.status(200).json({ reply });
        } catch {
            res.status(502).json({ error: "The assistant could not answer right now." });
        }
    },
);
