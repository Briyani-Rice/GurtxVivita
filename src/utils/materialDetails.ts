import type { Material, MaterialStockStatus } from "../types";

// The bulk inventory import stored every attribute as one semicolon-joined
// string, e.g. "Category: Materials; Where to find it: Paper Station;
// Packed in/moved to: Box 4; Stock status: In Stock". This module lifts the
// known keys into structured Material fields and keeps the rest as the
// human-readable description.

const FIELD_KEYS = {
    category: ["category"],
    location: ["where to find it"],
    storage: ["packed in/moved to", "move to"],
    supplier: ["supplier"],
    cricut: ["able to cricut"],
    stockStatus: ["stock status"],
} as const;

type ParsedFieldName = keyof typeof FIELD_KEYS;

export type ParsedMaterialDetails = {
    category?: string;
    location?: string;
    storage?: string;
    supplier?: string;
    cricut?: boolean;
    stockStatus?: MaterialStockStatus;
    /** Segments that did not match a known key, rejoined for display. */
    description: string;
};

function matchFieldName(key: string): ParsedFieldName | null {
    const normalizedKey = key.trim().toLowerCase();

    for (const [field, aliases] of Object.entries(FIELD_KEYS)) {
        if ((aliases as readonly string[]).includes(normalizedKey)) {
            return field as ParsedFieldName;
        }
    }

    return null;
}

export function parseStockStatus(value: string): MaterialStockStatus | undefined {
    const normalized = value.trim().toLowerCase();

    if (!normalized) return undefined;
    if (normalized === "in stock") return "in-stock";
    if (normalized === "low") return "low";
    if (normalized === "out of stock") return "out-of-stock";
    if (normalized === "wishlist") return "wishlist";
    if (normalized.includes("missing")) return "missing";

    return undefined;
}

export function parseMaterialDescription(description: string): ParsedMaterialDetails {
    const details: ParsedMaterialDetails = { description: "" };
    const leftovers: string[] = [];

    for (const segment of description.split(";")) {
        const trimmed = segment.trim();
        if (!trimmed) continue;

        const separatorIndex = trimmed.indexOf(":");
        const field = separatorIndex > 0
            ? matchFieldName(trimmed.slice(0, separatorIndex))
            : null;

        if (!field) {
            leftovers.push(trimmed);
            continue;
        }

        const value = trimmed.slice(separatorIndex + 1).trim();
        if (!value) continue;

        if (field === "cricut") {
            details.cricut = value.toLowerCase().startsWith("y");
        } else if (field === "stockStatus") {
            const status = parseStockStatus(value);
            if (status) {
                details.stockStatus = status;
            } else {
                leftovers.push(trimmed);
            }
        } else if (details[field]) {
            details[field] = `${details[field]}, ${value}`;
        } else {
            details[field] = value;
        }
    }

    details.description = leftovers.join("; ");
    return details;
}

/**
 * Returns a copy of the material with structured fields parsed out of the
 * imported description dump. Materials that already carry structured fields
 * (or have a plain description) come back unchanged.
 */
export function enrichMaterial(material: Material): Material {
    const hasStructuredFields = material.category !== undefined
        || material.location !== undefined
        || material.storage !== undefined
        || material.supplier !== undefined
        || material.cricut !== undefined
        || material.stockStatus !== undefined;

    if (hasStructuredFields) {
        return material;
    }

    const parsed = parseMaterialDescription(material.description);
    const { description, ...fields } = parsed;

    if (Object.keys(fields).every(key => fields[key as keyof typeof fields] === undefined)) {
        return material;
    }

    return {
        ...material,
        ...fields,
        description,
    };
}

export function isMaterialAvailable(material: Material): boolean {
    if (material.quantity > 0) return true;

    return material.stockStatus === "in-stock" || material.stockStatus === "low";
}

/** Short stock text for cards: exact count when known, status otherwise. */
export function materialStockLabel(material: Material): string {
    if (material.quantity > 0) {
        return `${material.quantity} ${material.unit}`;
    }

    if (material.stockStatus === "in-stock") return "In stock";
    if (material.stockStatus === "low") return "Low stock";
    if (material.stockStatus === "wishlist") return "Wishlist";
    if (material.stockStatus === "missing") return "Missing";

    return "Out of stock";
}

/** Keyed segments a child benefits from. Everything else is staff bookkeeping. */
const KIOSK_DESCRIPTION_KEYS = new Set(["used for"]);

const CONTAINS_URL = /https?:\/\//i;

/**
 * Strips a material description down to what a child should read.
 *
 * `description` is a merged blob of `Key: value` segments joined with ";" —
 * purchase remarks, loan history, supplier notes and Notion URLs all end up in
 * it, and the kiosk card renders it verbatim today. This keeps only an allowed
 * key plus genuine keyless prose, and drops anything carrying a URL.
 *
 * An allowlist rather than a denylist: staff type these keys by hand, so a
 * denylist is certain to leak the first key nobody thought of.
 */
export function kioskDescription(description: string): string {
    const kept: string[] = [];

    for (const segment of description.split(";")) {
        const trimmed = segment.trim();
        if (!trimmed || CONTAINS_URL.test(trimmed)) continue;

        const separatorIndex = trimmed.indexOf(":");

        if (separatorIndex === -1) {
            kept.push(trimmed);
            continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim().toLowerCase();
        if (!KIOSK_DESCRIPTION_KEYS.has(key)) continue;

        const value = trimmed.slice(separatorIndex + 1).trim();
        if (value) kept.push(value);
    }

    return kept.join("; ");
}
