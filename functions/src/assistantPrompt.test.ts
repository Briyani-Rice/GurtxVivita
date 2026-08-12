import assert from "node:assert/strict";
import { buildAssistantRequestBody, parseAssistantReply, sanitizeQuery, ASSISTANT_MODEL } from "./assistantPrompt.ts";

// sanitizeQuery trims and rejects empty / oversized input.
assert.equal(sanitizeQuery("  hi  "), "hi");
assert.equal(sanitizeQuery(""), null);
assert.equal(sanitizeQuery("   "), null);
assert.equal(sanitizeQuery(123), null);
assert.equal(sanitizeQuery("x".repeat(501)), null);

// Request body carries a safety-aware system prompt and the user's query.
const body = buildAssistantRequestBody("Can I bake a cake here?");
assert.equal(body.model, ASSISTANT_MODEL);
assert.equal(body.messages[0].role, "system");
assert.match(body.messages[0].content, /VIVITA|makerspace/i);
assert.match(body.messages[0].content, /safe|adult/i);
assert.equal(body.messages[1].role, "user");
assert.equal(body.messages[1].content, "Can I bake a cake here?");

// parseAssistantReply extracts the assistant text, or null on a malformed shape.
assert.equal(
    parseAssistantReply({ choices: [{ message: { content: "Try a cardboard oven model!" } }] }),
    "Try a cardboard oven model!",
);
assert.equal(parseAssistantReply({ choices: [] }), null);
assert.equal(parseAssistantReply({}), null);
assert.equal(parseAssistantReply(null), null);

console.log("assistantPrompt tests passed");
