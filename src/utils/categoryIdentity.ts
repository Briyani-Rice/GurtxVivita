/**
 * Gives every material category a glyph and a colour, so a wall of cards is
 * scannable before a single word is read.
 *
 * Categories come from `collectMaterialCategories`, which builds the list out
 * of whatever staff typed into the inventory — 27 distinct values today,
 * including "Findings. Hardware" and "VIVIPANEL supplies". A hardcoded map
 * would go stale the first time someone adds one, so recognised keywords get a
 * deliberate identity and everything else falls back to a stable hash.
 */

export type CategoryIconName =
    | "wrench"
    | "cog"
    | "droplet"
    | "cpu"
    | "layers"
    | "box"
    | "shirt"
    | "camera"
    | "sparkles"
    | "package";

/**
 * The only hues any category may use. A free hue from a hash produces colours
 * that fight the VIVITA palette; choosing from a curated set cannot.
 */
export const CATEGORY_HUES = [28, 45, 95, 150, 190, 215, 265, 330] as const;

/** Keyword → [icon, index into CATEGORY_HUES]. First match in order wins. */
const KEYWORD_IDENTITY: ReadonlyArray<readonly [string, CategoryIconName, number]> = [
    ["tool", "wrench", 0],
    ["machine", "cog", 5],
    ["adhesive", "droplet", 7],
    ["electronic", "cpu", 6],
    ["peripheral", "cpu", 6],
    ["device", "cpu", 6],
    ["memory", "cpu", 6],
    ["textile", "shirt", 7],
    ["fabric", "shirt", 7],
    ["photography", "camera", 4],
    ["display", "sparkles", 3],
    ["collateral", "sparkles", 3],
    ["packing", "box", 1],
    ["storage", "box", 1],
    ["container", "box", 1],
    ["kit", "package", 1],
    ["appliance", "cog", 5],
    ["kitchen", "cog", 5],
    ["paper", "layers", 2],
    ["material", "layers", 2],
];

const DEFAULT_ICON: CategoryIconName = "package";

/**
 * FNV-style rolling hash. Any stable hash works; what matters is that it is
 * deterministic across devices and reloads so a category never changes colour
 * under a child mid-session.
 */
function hueFor(normalized: string): number {
    let hash = 2166136261;

    for (let index = 0; index < normalized.length; index += 1) {
        hash ^= normalized.charCodeAt(index);
        hash = Math.imul(hash, 16777619) >>> 0;
    }

    return CATEGORY_HUES[hash % CATEGORY_HUES.length];
}

export function categoryIdentity(categoryName: string): { icon: CategoryIconName; hue: number } {
    const normalized = categoryName.trim().toLowerCase();

    if (!normalized) {
        return { icon: DEFAULT_ICON, hue: CATEGORY_HUES[0] };
    }

    for (const [keyword, icon, hueIndex] of KEYWORD_IDENTITY) {
        if (normalized.includes(keyword)) {
            return { icon, hue: CATEGORY_HUES[hueIndex] };
        }
    }

    return { icon: DEFAULT_ICON, hue: hueFor(normalized) };
}
