import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Compartment, FloorData, Material, MaterialRequest } from "../types";
import {
    approveMaterialRequestRecord,
    createMaterialRecord,
    createMaterialRequestRecord,
    deleteMaterialRecord,
    declineMaterialRequestRecord,
    listMaterialRequestRecords,
    listMaterialRecords,
    updateMaterialRecord,
    type MaterialInput,
} from "../services/firebaseInventory";
import { makerspaceItems, type MakerItem } from "./makerspaceData";
import {
    inventoryCompartments,
    inventoryFloors,
    mergeMakerItems,
    normalizeMaterialArea,
    starterMaterials,
    starterRequests,
} from "./inventoryStore";
import { isMaterialAvailable } from "../utils/materialDetails";

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
    submitRequest: (materialId: string, quantity: number, reason: string) => Promise<void>;
    approveRequest: (id: string) => Promise<void>;
    declineRequest: (id: string) => Promise<void>;
    getEmptyMaterials: () => Material[];
};

const InventoryContext = createContext<InventoryContextValue | null>(null);
const LOCAL_MATERIAL_ID_PREFIX = "local-";
const LOCAL_REQUEST_ID_PREFIX = "local-request-";

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

function isLocalRequest(id: string): boolean {
    return id.startsWith(LOCAL_REQUEST_ID_PREFIX);
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

function createLocalRequest(material: Material, quantity: number, reason: string): MaterialRequest {
    return {
        ...makeRequest(material, quantity, reason),
        id: `${LOCAL_REQUEST_ID_PREFIX}${crypto.randomUUID()}`,
    };
}

function showSyncError(action: string, error: unknown) {
    console.error(`Unable to ${action} Firebase inventory`, error);
    alert(`Unable to ${action} Firebase inventory. Check that Firestore is enabled and the materials/materialRequests collections are allowed.`);
}

function showLocalSyncWarning(action: string, error: unknown) {
    console.warn(`Unable to ${action} Firebase inventory; saved locally for this session.`, error);
    alert(`Firebase is not available. This change was saved locally for this session, but it will not sync until Firestore is reachable.`);
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
    const [floors, setFloors] = useState<FloorData[]>(inventoryFloors);
    const [materials, setMaterials] = useState<Material[]>(starterMaterials);
    const [requests, setRequests] = useState<MaterialRequest[]>(starterRequests);

    useEffect(() => {
        let isMounted = true;

        Promise.all([
            listMaterialRecords(),
            listMaterialRequestRecords(),
        ])
            .then(([savedMaterials, savedRequests]) => {
                if (isMounted && savedMaterials.length > 0) {
                    setMaterials(savedMaterials.map(normalizeMaterialArea));
                }
                if (isMounted) {
                    setRequests(savedRequests);
                }
            })
            .catch(error => {
                console.warn("Unable to load Firebase inventory; using starter data.", error);
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
        submitRequest: async (materialId, quantity, reason) => {
            const material = materials.find(material => material.id === materialId);
            if (!material) return;

            try {
                const savedRequest = await createMaterialRequestRecord({
                    materialId: material.id,
                    materialName: material.name,
                    requestedQuantity: quantity,
                    reason,
                    comments: undefined,
                });
                setRequests(prev => [savedRequest, ...prev]);
            } catch (error) {
                setRequests(prev => [createLocalRequest(material, quantity, reason), ...prev]);
                showLocalSyncWarning("submit request to", error);
            }
        },
        approveRequest: async (id) => {
            const request = requests.find(request => request.id === id);
            const material = request
                ? materials.find(material => material.id === request.materialId)
                : undefined;

            if (request && material) {
                if (isLocalMaterial(material.id) || isLocalRequest(request.id)) {
                    const nextMaterial = {
                        ...material,
                        quantity: Math.max(0, material.quantity - request.requestedQuantity),
                    };
                    setMaterials(prev => prev.map(existing =>
                        existing.id === material.id ? normalizeMaterialArea(nextMaterial) : existing
                    ));
                } else {
                    try {
                        const saved = await approveMaterialRequestRecord(request, material);
                        setMaterials(prev => prev.map(existing =>
                            existing.id === material.id ? normalizeMaterialArea(saved.material) : existing
                        ));
                        setRequests(prev => prev.map(existingRequest =>
                            existingRequest.id === id ? saved.request : existingRequest
                        ));
                        return;
                    } catch (error) {
                        showSyncError("approve request in", error);
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
        declineRequest: async (id) => {
            const request = requests.find(request => request.id === id);

            if (request && !isLocalRequest(request.id)) {
                try {
                    const savedRequest = await declineMaterialRequestRecord(request);
                    setRequests(prev => prev.map(existing =>
                        existing.id === id ? savedRequest : existing
                    ));
                    return;
                } catch (error) {
                    showSyncError("decline request in", error);
                    return;
                }
            }

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
        getEmptyMaterials: () => materials.filter(material => !isMaterialAvailable(material)),
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
