import assert from "node:assert/strict";
import { buildGroqRequestBody, parseGroqReply, sanitizeQuery, GROQ_MODEL } from "./groqPrompt.ts";

// sanitizeQuery trims and rejects empty / oversized input.
assert.equal(sanitizeQuery("  hi  "), "hi");
assert.equal(sanitizeQuery(""), null);
assert.equal(sanitizeQuery("   "), null);
assert.equal(sanitizeQuery(123), null);
assert.equal(sanitizeQuery("x".repeat(501)), null);

// Request body carries a safety-aware system prompt and the user's query.
const body = buildGroqRequestBody("Can I bake a cake here?");
assert.equal(body.model, GROQ_MODEL);
assert.equal(body.messages[0].role, "system");
assert.match(body.messages[0].content, /VIVITA|makerspace/i);
assert.match(body.messages[0].content, /safe|adult/i);
assert.equal(body.messages[1].role, "user");
assert.equal(body.messages[1].content, "Can I bake a cake here?");

// parseGroqReply extracts the assistant text, or null on a malformed shape.
assert.equal(
    parseGroqReply({ choices: [{ message: { content: "Try a cardboard oven model!" } }] }),
    "Try a cardboard oven model!",
);
assert.equal(parseGroqReply({ choices: [] }), null);
assert.equal(parseGroqReply({}), null);
assert.equal(parseGroqReply(null), null);

console.log("groqPrompt tests passed");
