import assert from "node:assert/strict";
import { askAssistantFallback } from "./makerAssistantClient.ts";

const url = "https://example.test/makerAssistant";

function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

// Happy path: returns the reply string.
const okReply = await askAssistantFallback("bake a cake?", {
    url,
    fetchImpl: async () => jsonResponse(200, { reply: "Try building a cardboard oven!" }),
});
assert.equal(okReply, "Try building a cardboard oven!");

// Non-OK response -> null.
const errReply = await askAssistantFallback("bake a cake?", {
    url,
    fetchImpl: async () => jsonResponse(502, { error: "nope" }),
});
assert.equal(errReply, null);

// Thrown fetch -> null.
const thrownReply = await askAssistantFallback("bake a cake?", {
    url,
    fetchImpl: async () => { throw new Error("network down"); },
});
assert.equal(thrownReply, null);

// Missing url -> null (no network attempted).
const noUrlReply = await askAssistantFallback("bake a cake?", {
    url: "",
    fetchImpl: async () => { throw new Error("should not be called"); },
});
assert.equal(noUrlReply, null);

// Empty query -> null.
const emptyReply = await askAssistantFallback("   ", { url, fetchImpl: async () => jsonResponse(200, { reply: "x" }) });
assert.equal(emptyReply, null);

console.log("makerAssistantClient tests passed");
