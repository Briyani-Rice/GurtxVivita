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
