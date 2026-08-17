import type { Material } from "../types";
import { materialCategoryNames } from "./materialCategories";
import { isMaterialAvailable } from "./materialDetails";

export function normalizeMaterialSearchQuery(query: string): string {
    return query.trim().toLowerCase();
}

export function filterMaterialsBySearch(
    materials: Material[],
    query: string
): Material[] {
    const normalizedQuery = normalizeMaterialSearchQuery(query);

    if (!normalizedQuery) {
        return materials;
    }

    return materials.filter(material =>
        [
            material.name,
            material.description,
            material.category,
            material.location,
            material.storage,
            material.supplier,
        ].some(value => value?.toLowerCase().includes(normalizedQuery))
    );
}

/**
 * In-stock alternatives for a material a child cannot have right now.
 *
 * A grey "Out of stock" pill ends the conversation; three things they *can*
 * use keeps it going. Ranked by how many categories they share, then by name so
 * the order is stable across renders.
 */
export function findSubstitutes(
    material: Material,
    all: Material[],
    limit = 3
): Material[] {
    const wanted = new Set(
        materialCategoryNames(material).map(name => name.toLowerCase())
    );

    if (wanted.size === 0 || limit <= 0) {
        return [];
    }

    return all
        .filter(candidate => candidate.id !== material.id && isMaterialAvailable(candidate))
        .map(candidate => ({
            candidate,
            shared: materialCategoryNames(candidate)
                .filter(name => wanted.has(name.toLowerCase())).length,
        }))
        .filter(entry => entry.shared > 0)
        .sort((a, b) =>
            b.shared - a.shared || a.candidate.name.localeCompare(b.candidate.name)
        )
        .slice(0, limit)
        .map(entry => entry.candidate);
}
