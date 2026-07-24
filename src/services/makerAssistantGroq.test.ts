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
