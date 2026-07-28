import assert from "node:assert/strict";
import { nextScene, TV_SCENES, type SceneId } from "./sceneRotation.ts";

assert.deepEqual(TV_SCENES, ["ambient", "roomMap", "kioskMirror", "voting"]);

assert.equal(nextScene("ambient", TV_SCENES), "roomMap");
assert.equal(nextScene("voting", TV_SCENES), "ambient", "wraps to first");

const single: SceneId[] = ["ambient"];
assert.equal(nextScene("ambient", single), "ambient", "single scene stays");

assert.equal(
    nextScene("voting", ["ambient", "roomMap"]),
    "ambient",
    "current not in enabled list restarts at first",
);
