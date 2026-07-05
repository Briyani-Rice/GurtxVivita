import type { Material } from "../types";

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
        material.name.toLowerCase().includes(normalizedQuery)
    );
}
