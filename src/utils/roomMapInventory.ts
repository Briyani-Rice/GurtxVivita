import type { Material } from "../types";

export function getAreaInventory(
    materials: Material[] = [],
    areaId: string | undefined
): Material[] {
    if (!areaId) {
        return [];
    }

    return materials.filter(material => material.compartmentId === areaId);
}

export function getAreaInventoryTotal(
    materials: Material[] = [],
    areaId: string | undefined
): number {
    return getAreaInventory(materials, areaId).reduce(
        (total, material) => total + material.quantity,
        0
    );
}
