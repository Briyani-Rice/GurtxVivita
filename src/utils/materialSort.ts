import type { Material } from "../types";
import { isMaterialAvailable } from "./materialDetails";
import { materialRequiresAdultSupervision } from "../components/inventoryStore";

export type MaterialSortKey =
    | "default"
    | "name-asc"
    | "name-desc"
    | "location"
    | "adult-first"
    | "stock";

export const MATERIAL_SORT_KEYS: MaterialSortKey[] = [
    "default",
    "name-asc",
    "name-desc",
    "location",
    "adult-first",
    "stock",
];

function byName(a: Material, b: Material): number {
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
}

// Prefer an explicit map location, fall back to storage; empty when neither is
// known so those items can be pushed to the end of a location sort.
function locationKey(material: Material): string {
    return (material.location ?? material.storage ?? "").trim().toLowerCase();
}

// Lower rank sorts first: in-stock, then low, then everything unavailable
// (out-of-stock / missing / wishlist / unknown).
function stockRank(material: Material): number {
    if (material.stockStatus === "low") return 1;
    if (isMaterialAvailable(material)) return 0;
    return 2;
}

/**
 * Returns a new, sorted copy of `materials`. "default" preserves the incoming
 * order (relevance / import order). Every other key breaks ties by name so the
 * result is stable and predictable regardless of the source ordering.
 */
export function sortMaterials(materials: Material[], key: MaterialSortKey): Material[] {
    const items = [...materials];

    switch (key) {
        case "name-asc":
            return items.sort(byName);
        case "name-desc":
            return items.sort((a, b) => byName(b, a));
        case "location":
            return items.sort((a, b) => {
                const la = locationKey(a);
                const lb = locationKey(b);
                if (!la && lb) return 1;
                if (la && !lb) return -1;
                return la.localeCompare(lb) || byName(a, b);
            });
        case "adult-first":
            return items.sort((a, b) => {
                const aRank = materialRequiresAdultSupervision(a) ? 0 : 1;
                const bRank = materialRequiresAdultSupervision(b) ? 0 : 1;
                return aRank - bRank || byName(a, b);
            });
        case "stock":
            return items.sort((a, b) => stockRank(a) - stockRank(b) || byName(a, b));
        case "default":
        default:
            return items;
    }
}
