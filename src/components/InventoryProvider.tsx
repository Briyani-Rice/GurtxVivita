import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Compartment, FloorData, Material, MaterialRequest } from "../types";
import {
    createMaterialRecord,
    deleteMaterialRecord,
    listMaterialRecords,
    updateMaterialRecord,
    type MaterialInput,
} from "../services/pocketbaseMaterials";
import { makerspaceItems, type MakerItem } from "./makerspaceData";
import {
    inventoryCompartments,
    inventoryFloors,
    mergeMakerItems,
    normalizeMaterialArea,
    starterMaterials,
    starterRequests,
} from "./inventoryStore";

type InventoryContextValue = {
    floors: FloorData[];
    setFloors: React.Dispatch<React.SetStateAction<FloorData[]>>;
    compartments: Compartment[];
    materials: Material[];
    requests: MaterialRequest[];
    makerItems: MakerItem[];
    addMaterial: (material: MaterialInput) => Promise<void>;
    editMaterial: (id: string, material: MaterialInput) => Promise<void>;
    deleteMaterial: (id: string) => Promise<void>;
    submitRequest: (materialId: string, quantity: number, reason: string) => void;
    approveRequest: (id: string) => Promise<void>;
    declineRequest: (id: string) => void;
    getEmptyMaterials: () => Material[];
};

const InventoryContext = createContext<InventoryContextValue | null>(null);
const LOCAL_MATERIAL_ID_PREFIX = "local-";

function toMaterialInput(material: Material): MaterialInput {
    return {
        name: material.name,
        description: material.description,
        quantity: material.quantity,
        unit: material.unit,
        compartmentId: material.compartmentId,
    };
}

function createLocalMaterial(material: MaterialInput): Material {
    return {
        ...material,
        id: `${LOCAL_MATERIAL_ID_PREFIX}${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
    };
}

function isLocalMaterial(id: string): boolean {
    return id.startsWith(LOCAL_MATERIAL_ID_PREFIX);
}

function makeRequest(material: Material, quantity: number, reason: string): MaterialRequest {
    return {
        id: crypto.randomUUID(),
        materialId: material.id,
        materialName: material.name,
        requestedQuantity: Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1,
        reason: reason.trim() || "No reason provided",
        status: "pending",
        createdAt: new Date().toISOString(),
    };
}

function showSyncError(action: string, error: unknown) {
    console.error(`Unable to ${action} material in PocketBase`, error);
    alert(`Unable to ${action} material. Check that PocketBase is running and the materials collection exists.`);
}

function showLocalSyncWarning(action: string, error: unknown) {
    console.warn(`Unable to ${action} material in PocketBase; saved locally for this session.`, error);
    alert(`PocketBase is not available. The material was saved locally for this session, but it will not sync until PocketBase is running.`);
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
    const [floors, setFloors] = useState<FloorData[]>(inventoryFloors);
    const [materials, setMaterials] = useState<Material[]>(starterMaterials);
    const [requests, setRequests] = useState<MaterialRequest[]>(starterRequests);

    useEffect(() => {
        let isMounted = true;

        listMaterialRecords()
            .then(savedMaterials => {
                if (isMounted && savedMaterials.length > 0) {
                    setMaterials(savedMaterials.map(normalizeMaterialArea));
                }
            })
            .catch(error => {
                console.warn("Unable to load PocketBase materials; using starter data.", error);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const value = useMemo<InventoryContextValue>(() => ({
        floors,
        setFloors,
        compartments: inventoryCompartments,
        materials,
        requests,
        makerItems: mergeMakerItems(makerspaceItems, materials),
        addMaterial: async (material) => {
            try {
                const savedMaterial = await createMaterialRecord(material);
                setMaterials(prev => [normalizeMaterialArea(savedMaterial), ...prev]);
            } catch (error) {
                setMaterials(prev => [normalizeMaterialArea(createLocalMaterial(material)), ...prev]);
                showLocalSyncWarning("add", error);
            }
        },
        editMaterial: async (id, material) => {
            if (isLocalMaterial(id)) {
                setMaterials(prev => prev.map(existing =>
                    existing.id === id
                        ? normalizeMaterialArea({
                            ...existing,
                            ...material,
                        })
                        : existing
                ));
                return;
            }

            try {
                const savedMaterial = await updateMaterialRecord(id, material);
                setMaterials(prev => prev.map(existing =>
                    existing.id === id ? normalizeMaterialArea(savedMaterial) : existing
                ));
            } catch (error) {
                setMaterials(prev => prev.map(existing =>
                    existing.id === id
                        ? normalizeMaterialArea({
                            ...existing,
                            ...material,
                        })
                        : existing
                ));
                showSyncError("update", error);
            }
        },
        deleteMaterial: async (id) => {
            const removeMaterial = () => {
                setMaterials(prev => prev.filter(material => material.id !== id));
                setRequests(prev => prev.filter(request => request.materialId !== id));
            };

            if (isLocalMaterial(id)) {
                removeMaterial();
                return;
            }

            try {
                await deleteMaterialRecord(id);
                removeMaterial();
            } catch (error) {
                removeMaterial();
                showSyncError("delete", error);
            }
        },
        submitRequest: (materialId, quantity, reason) => {
            const material = materials.find(material => material.id === materialId);
            if (!material) return;
            setRequests(prev => [makeRequest(material, quantity, reason), ...prev]);
        },
        approveRequest: async (id) => {
            const request = requests.find(request => request.id === id);
            const material = request
                ? materials.find(material => material.id === request.materialId)
                : undefined;

            if (request && material) {
                const nextMaterial = {
                    ...material,
                    quantity: Math.max(0, material.quantity - request.requestedQuantity),
                };

                if (isLocalMaterial(material.id)) {
                    setMaterials(prev => prev.map(existing =>
                        existing.id === material.id ? normalizeMaterialArea(nextMaterial) : existing
                    ));
                } else {
                try {
                    const savedMaterial = await updateMaterialRecord(
                        material.id,
                        toMaterialInput(nextMaterial),
                    );
                    setMaterials(prev => prev.map(existing =>
                        existing.id === material.id ? normalizeMaterialArea(savedMaterial) : existing
                    ));
                } catch (error) {
                    showSyncError("update", error);
                    return;
                }
                }
            }

            setRequests(prev => prev.map(existingRequest =>
                existingRequest.id === id
                    ? {
                        ...existingRequest,
                        status: "approved",
                        respondedAt: new Date().toISOString(),
                    }
                    : existingRequest
            ));
        },
        declineRequest: (id) => {
            setRequests(prev => prev.map(request =>
                request.id === id
                    ? {
                        ...request,
                        status: "declined",
                        respondedAt: new Date().toISOString(),
                    }
                    : request
            ));
        },
        getEmptyMaterials: () => materials.filter(material => material.quantity <= 0),
    }), [floors, materials, requests]);

    return (
        <InventoryContext.Provider value={value}>
            {children}
        </InventoryContext.Provider>
    );
}

export function useInventory(): InventoryContextValue {
    const value = useContext(InventoryContext);
    if (!value) {
        throw new Error("useInventory must be used inside InventoryProvider");
    }
    return value;
}

export { materialToMakerItem } from "./inventoryStore";
