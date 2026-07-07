import type { Compartment, FloorData, Material, MaterialRequest } from "../types";
import type { MakerItem } from "./makerspaceData";
import { vivitaFloor, vivitaMaterials } from "./roomMapData.ts";

const areaColors: Record<string, string> = {
    "white-space": "#f8fafc",
    "tinkering-studio": "#2563eb",
    worktables: "#A1824F",
    "pegboard-storage": "#f97316",
    "vivi-shelving": "#f97316",
    vivistudio: "#111827",
    "roof-terrace": "#6b7280",
};

const areaNumbers: Record<string, string> = {
    "white-space": "WS",
    "tinkering-studio": "TS",
    worktables: "WT",
    "pegboard-storage": "PB",
    "vivi-shelving": "VS",
    vivistudio: "VV",
    "roof-terrace": "RT",
};

export const inventoryFloors: FloorData[] = [vivitaFloor];

export const inventoryAreaIds = [
    "white-space",
    "tinkering-studio",
    "worktables",
    "pegboard-storage",
    "vivi-shelving",
    "vivistudio",
    "roof-terrace",
];

export const inventoryCompartments: Compartment[] = vivitaFloor.elements
    .filter(element => inventoryAreaIds.includes(element.id))
    .map(element => ({
        id: element.id,
        number: areaNumbers[element.id] ?? element.id.toUpperCase(),
        name: element.name ?? element.label ?? element.id,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        color: areaColors[element.id] ?? "#64748b",
    }));

export const starterMaterials: Material[] = vivitaMaterials;

export const starterRequests: MaterialRequest[] = [];

function stableHash(value: string): number {
    return [...value].reduce((hash, character) => {
        return ((hash << 5) - hash + character.charCodeAt(0)) | 0;
    }, 0);
}

export function assignMaterialToMapArea(material: Pick<Material, "id" | "name" | "compartmentId">): string {
    if (inventoryAreaIds.includes(material.compartmentId)) {
        return material.compartmentId;
    }

    const key = normalizeAlias(`${material.id} ${material.name}`);
    const index = Math.abs(stableHash(key)) % inventoryAreaIds.length;
    return inventoryAreaIds[index];
}

export function normalizeMaterialArea(material: Material): Material {
    const compartmentId = assignMaterialToMapArea(material);

    if (material.compartmentId === compartmentId) {
        return material;
    }

    return {
        ...material,
        compartmentId,
    };
}

function normalizeAlias(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9:+ ]/g, " ").replace(/\s+/g, " ").trim();
}

function unique(values: string[]): string[] {
    return [...new Set(values.map(normalizeAlias).filter(Boolean))];
}

function inferType(material: Material): MakerItem["type"] {
    const text = `${material.name} ${material.description}`.toLowerCase();

    if (/\b(glue|scissors?|solder|drill|saw|knife|cutter|tool)\b/.test(text)) {
        return "tool";
    }

    if (/\b(printer|laptop|projector|camera|tripod|micro:?bit|machine|equipment)\b/.test(text)) {
        return "equipment";
    }

    return "material";
}

function inferSafety(material: Material): MakerItem["safetyLevel"] {
    const text = `${material.name} ${material.description}`.toLowerCase();
    return /\b(hot|solder|saw|drill|knife|cutter|3d printer|printer)\b/.test(text)
        ? "adult"
        : "normal";
}

export function materialToMakerItem(
    material: Material,
    compartments: Compartment[] = inventoryCompartments,
): MakerItem {
    const compartment = compartments.find(entry => entry.id === material.compartmentId);
    const zone = compartment?.name ?? (material.compartmentId || "Unassigned area");
    const shelf = compartment?.number ? `${compartment.number} inventory` : "Inventory";

    return {
        id: material.id,
        name: material.name,
        type: inferType(material),
        aliases: unique([material.name, material.description]),
        location: {
            zone,
            shelf,
            detail: `${material.name} is stored in ${zone}.`,
        },
        quantity: material.quantity,
        unit: material.unit,
        description: material.description || `${material.name} in the Viventory inventory.`,
        safetyLevel: inferSafety(material),
        instructions: [
            `Check the quantity before taking ${material.name}.`,
            "Ask a staff member if you are unsure where it belongs.",
            "Return it to the same area after use.",
        ],
        imageHint: material.name,
    };
}

export function mergeMakerItems(staticItems: MakerItem[], materials: Material[]): MakerItem[] {
    const dynamicItems = materials.map(material => materialToMakerItem(material));
    const seen = new Set<string>();

    return [...dynamicItems, ...staticItems].filter(item => {
        const key = normalizeAlias(item.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
