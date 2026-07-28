import assert from "node:assert/strict";
import { isSafeHttpUrl } from "./externalUrl.ts";

assert.equal(isSafeHttpUrl("https://youtu.be/abc"), true);
assert.equal(isSafeHttpUrl("http://example.com/guide.png"), true);
assert.equal(isSafeHttpUrl("  https://example.com/x  "), true, "should tolerate surrounding whitespace");

assert.equal(isSafeHttpUrl(""), false);
assert.equal(isSafeHttpUrl(undefined), false);
assert.equal(isSafeHttpUrl(null), false);
assert.equal(isSafeHttpUrl("javascript:alert(1)"), false, "must reject javascript: URLs");
assert.equal(isSafeHttpUrl("data:text/html,<script>"), false, "must reject data: URLs");
assert.equal(isSafeHttpUrl("file:///etc/passwd"), false, "must reject file: URLs");
assert.equal(isSafeHttpUrl("not a url"), false);

console.log("externalUrl tests passed");
