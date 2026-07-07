import type { Compartment, FloorData, Material, MaterialRequest } from "../types";
import type { MakerItem } from "./makerspaceData";

export const inventoryFloors: FloorData[] = [
    {
        id: "floor-1",
        name: "Level 1",
        elements: [
            {
                id: "comp-101",
                type: "compartment",
                x: 50,
                y: 40,
                width: 140,
                height: 90,
                number: "A101",
                name: "Storage Room",
                color: "#60a5fa",
                label: "Storage",
            },
            {
                id: "comp-102",
                type: "compartment",
                x: 240,
                y: 40,
                width: 160,
                height: 90,
                number: "A102",
                name: "Electronics Lab",
                color: "#34d399",
                label: "Electronics",
            },
            {
                id: "stairs-1",
                type: "stairs",
                x: 430,
                y: 40,
                width: 60,
                height: 60,
                label: "Stairs",
            },
            {
                id: "lift-1",
                type: "lift",
                x: 520,
                y: 40,
                width: 50,
                height: 50,
                label: "Lift",
            },
        ],
    },
    {
        id: "floor-2",
        name: "Level 2",
        elements: [
            {
                id: "comp-201",
                type: "compartment",
                x: 70,
                y: 60,
                width: 180,
                height: 100,
                number: "B201",
                name: "Meeting Room",
                color: "#A1824F",
                label: "Meeting",
            },
            {
                id: "comp-202",
                type: "compartment",
                x: 300,
                y: 60,
                width: 170,
                height: 100,
                number: "B202",
                name: "Server Room",
                color: "#f87171",
                label: "Servers",
            },
        ],
    },
];

export const inventoryCompartments: Compartment[] = [
    {
        id: "comp-101",
        number: "A101",
        name: "Storage Room",
        x: 50,
        y: 40,
        width: 140,
        height: 90,
        color: "#60a5fa",
    },
    {
        id: "comp-102",
        number: "A102",
        name: "Electronics Lab",
        x: 240,
        y: 40,
        width: 160,
        height: 90,
        color: "#34d399",
    },
    {
        id: "comp-201",
        number: "B201",
        name: "Meeting Room",
        x: 70,
        y: 60,
        width: 180,
        height: 100,
        color: "#A1824F",
    },
    {
        id: "comp-202",
        number: "B202",
        name: "Server Room",
        x: 300,
        y: 60,
        width: 170,
        height: 100,
        color: "#f87171",
    },
];

export const starterMaterials: Material[] = [
    {
        id: "mat-1",
        name: "HDMI Cable",
        description: "2m HDMI cable",
        quantity: 12,
        unit: "pcs",
        compartmentId: "comp-101",
        createdAt: new Date().toISOString(),
    },
    {
        id: "mat-2",
        name: "Laptop",
        description: "Dell Latitude Laptop",
        quantity: 5,
        unit: "units",
        compartmentId: "comp-102",
        createdAt: new Date().toISOString(),
    },
    {
        id: "mat-3",
        name: "Projector",
        description: "Portable projector",
        quantity: 0,
        unit: "units",
        compartmentId: "comp-201",
        createdAt: new Date().toISOString(),
    },
];

export const starterRequests: MaterialRequest[] = [];

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
