import assert from "node:assert/strict";
import { clampZoom, panForZoomAtPoint } from "./cameraZoom.ts";

assert.equal(clampZoom(5, 0.45, 2.5), 2.5);
assert.equal(clampZoom(0.1, 0.45, 2.5), 0.45);
assert.equal(clampZoom(1, 0.45, 2.5), 1);

// The world point under the anchor must map back to the same screen point
// after zooming.
const pan = { x: 40, y: 40 };
const anchor = { x: 300, y: 200 };
const fromZoom = 1;
const toZoom = 2;

const worldX = (anchor.x - pan.x) / fromZoom;
const worldY = (anchor.y - pan.y) / fromZoom;

const nextPan = panForZoomAtPoint(pan, fromZoom, toZoom, anchor);
const projectedX = nextPan.x + worldX * toZoom;
const projectedY = nextPan.y + worldY * toZoom;

assert.ok(Math.abs(projectedX - anchor.x) < 1e-9, "anchor x should stay fixed while zooming");
assert.ok(Math.abs(projectedY - anchor.y) < 1e-9, "anchor y should stay fixed while zooming");

// Zooming with the anchor at the current pan origin leaves pan unchanged.
const samePan = panForZoomAtPoint(pan, 1, 1.5, pan);
assert.deepEqual(samePan, pan, "anchoring at the pan origin should not move pan");

console.log("cameraZoom tests passed");
