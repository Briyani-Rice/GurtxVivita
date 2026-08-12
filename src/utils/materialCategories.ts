import type { Material } from "../types";

/** Sentinel for "no category filter applied". */
export const ALL_CATEGORIES = "__all__";

export type CategoryOption = {
    /** Display name, in the casing first seen in the inventory. */
    name: string;
    /** How many materials carry this category. */
    count: number;
};

/**
 * Splits a material's category field into individual category names.
 *
 * `enrichMaterial` joins repeated "Category:" segments with ", ", so a comma is
 * the multi-value separator. Category names themselves separate their own words
 * with periods ("Findings. Hardware", "Adhesive. Fasteners. Wires") and never
 * contain commas, which is why splitting on comma alone is safe here.
 */
export function materialCategoryNames(material: Material): string[] {
    const seen = new Set<string>();
    const names: string[] = [];

    for (const segment of (material.category ?? "").split(",")) {
        const name = segment.trim();
        if (!name) continue;

        const key = name.toLowerCase();
        if (seen.has(key)) continue;

        seen.add(key);
        names.push(name);
    }

    return names;
}

/**
 * Builds the canonical category list from whatever is actually in the
 * inventory, so staff-added categories show up without a code change.
 * Matching is case-insensitive; the first casing seen wins for display.
 */
export function collectMaterialCategories(materials: Material[]): CategoryOption[] {
    const byKey = new Map<string, CategoryOption>();

    for (const material of materials) {
        for (const name of materialCategoryNames(material)) {
            const key = name.toLowerCase();
            const existing = byKey.get(key);

            if (existing) {
                existing.count += 1;
            } else {
                byKey.set(key, { name, count: 1 });
            }
        }
    }

    return [...byKey.values()].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true })
    );
}

/** Narrows materials to one category. Unknown or empty categories filter nothing. */
export function filterMaterialsByCategory(
    materials: Material[],
    category: string
): Material[] {
    const target = category.trim().toLowerCase();

    if (!target || target === ALL_CATEGORIES) {
        return materials;
    }

    return materials.filter(material =>
        materialCategoryNames(material).some(name => name.toLowerCase() === target)
    );
}
