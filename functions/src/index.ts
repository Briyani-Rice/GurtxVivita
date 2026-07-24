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
