type AskOptions = {
    url?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
};

function defaultUrl(): string {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
    return String(env?.VITE_MAKER_ASSISTANT_URL ?? "").trim();
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
