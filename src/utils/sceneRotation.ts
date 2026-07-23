export type SceneId = "ambient" | "roomMap" | "kioskMirror" | "voting";

export const TV_SCENES: SceneId[] = ["ambient", "roomMap", "kioskMirror", "voting"];

export const TV_ROTATION_MS = 15_000;

export function nextScene(current: SceneId, enabled: SceneId[]): SceneId {
    if (enabled.length === 0) return current;
    const index = enabled.indexOf(current);
    if (index === -1) return enabled[0];
    return enabled[(index + 1) % enabled.length];
}
