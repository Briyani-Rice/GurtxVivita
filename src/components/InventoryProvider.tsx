import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Compartment, FloorData, Material, MaterialRequest } from "../types";
import {
    approveMaterialRequestRecord,
    approveRequestWithoutStockRecord,
    createMaterialRecord,
    createMaterialRequestRecord,
    createProjectIdeaRecord,
    deleteMaterialRecord,
    deleteProjectIdeaRecord,
    declineMaterialRequestRecord,
    subscribeMaterialRecords,
    subscribeMaterialRequestRecords,
    subscribeProjectIdeaRecords,
    updateMaterialRecord,
    updateProjectIdeaRecord,
    type MaterialInput,
    type ProjectIdeaInput,
} from "../services/firebaseInventory";
import { makerspaceItems, projectIdeas as starterProjectIdeas, type MakerItem, type MakerProjectIdea } from "./makerspaceData";
import {
    inventoryCompartments,
    inventoryFloors,
    mergeLocalEntries,
    mergeMakerItems,
    normalizeMaterialArea,
    starterMaterials,
    starterRequests,
} from "./inventoryStore";
import { isMaterialAvailable } from "../utils/materialDetails";
import { toast } from "sonner";

type InventoryContextValue = {
    floors: FloorData[];
    setFloors: React.Dispatch<React.SetStateAction<FloorData[]>>;
    compartments: Compartment[];
    materials: Material[];
    requests: MaterialRequest[];
    makerItems: MakerItem[];
    projectIdeas: MakerProjectIdea[];
    addMaterial: (material: MaterialInput) => Promise<void>;
    editMaterial: (id: string, material: MaterialInput) => Promise<void>;
    deleteMaterial: (id: string) => Promise<void>;
    addProjectIdea: (idea: ProjectIdeaInput) => Promise<void>;
    editProjectIdea: (id: string, idea: ProjectIdeaInput) => Promise<void>;
    deleteProjectIdea: (id: string) => Promise<void>;
    submitRequest: (materialId: string, quantity: number, reason: string) => Promise<void>;
    approveRequest: (id: string) => Promise<void>;
    declineRequest: (id: string) => Promise<void>;
    getEmptyMaterials: () => Material[];
};

const InventoryContext = createContext<InventoryContextValue | null>(null);
const LOCAL_MATERIAL_ID_PREFIX = "local-";
const LOCAL_REQUEST_ID_PREFIX = "local-request-";
const LOCAL_IDEA_ID_PREFIX = "local-idea-";

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

function isLocalIdea(id: string): boolean {
    return id.startsWith(LOCAL_IDEA_ID_PREFIX);
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

// Non-blocking toasts instead of modal alert()s: on an unattended kiosk with
// flaky Wi-Fi, stacked alert() dialogs would trap the screen.
function showSyncError(action: string, error: unknown) {
    console.error(`Unable to ${action} Firebase inventory`, error);
    toast.error(`Unable to ${action}. Check that Firestore is reachable and the collections are allowed.`);
}

function showLocalSyncWarning(action: string, error: unknown) {
    console.warn(`Unable to ${action} Firebase inventory; saved locally for this session.`, error);
    toast.warning("Saved locally for this session only — it will not sync until Firestore is reachable.");
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
    const [floors, setFloors] = useState<FloorData[]>(inventoryFloors);
    const [materials, setMaterials] = useState<Material[]>(starterMaterials);
    const [requests, setRequests] = useState<MaterialRequest[]>(starterRequests);
    const [projectIdeas, setProjectIdeas] = useState<MakerProjectIdea[]>(starterProjectIdeas);

    // Once a collection has streamed real data we let it go back to empty
    // (e.g. the admin deletes the last item). Before that first non-empty
    // snapshot we keep the bundled starter/default content so an unseeded or
    // still-loading collection doesn't blank out the kiosk.
    const seenServerData = useRef({ materials: false, ideas: false });

    // Live Firestore subscriptions keep the kiosk in sync with admin edits
    // in near real time; on error we keep the local starter data.
    useEffect(() => {
        const unsubscribers: (() => void)[] = [];

        try {
            unsubscribers.push(subscribeMaterialRecords(
                savedMaterials => {
                    if (savedMaterials.length > 0) {
                        seenServerData.current.materials = true;
                    }
                    if (savedMaterials.length > 0 || seenServerData.current.materials) {
                        setMaterials(prev => mergeLocalEntries(
                            prev,
                            savedMaterials.map(normalizeMaterialArea),
                            isLocalMaterial,
                        ));
                    }
                },
                error => console.warn("Unable to stream Firebase materials; using starter data.", error),
            ));
            unsubscribers.push(subscribeMaterialRequestRecords(
                savedRequests => setRequests(prev => mergeLocalEntries(prev, savedRequests, isLocalRequest)),
                error => console.warn("Unable to stream Firebase requests; using local requests.", error),
            ));
            unsubscribers.push(subscribeProjectIdeaRecords(
                savedIdeas => {
                    if (savedIdeas.length > 0) {
                        seenServerData.current.ideas = true;
                    }
                    if (savedIdeas.length > 0 || seenServerData.current.ideas) {
                        setProjectIdeas(prev => mergeLocalEntries(prev, savedIdeas, isLocalIdea));
                    }
                },
                error => console.warn("Unable to stream Firebase project ideas; using starter ideas.", error),
            ));
        } catch (error) {
            console.warn("Unable to connect to Firebase inventory; using starter data.", error);
        }

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, []);

    const value = useMemo<InventoryContextValue>(() => ({
        floors,
        setFloors,
        compartments: inventoryCompartments,
        materials,
        requests,
        makerItems: mergeMakerItems(makerspaceItems, materials),
        projectIdeas,
        addProjectIdea: async (idea) => {
            try {
                const savedIdea = await createProjectIdeaRecord(idea);
                setProjectIdeas(prev => [savedIdea, ...prev]);
            } catch (error) {
                setProjectIdeas(prev => [
                    { ...idea, id: `${LOCAL_IDEA_ID_PREFIX}${crypto.randomUUID()}` },
                    ...prev,
                ]);
                showLocalSyncWarning("add project idea to", error);
            }
        },
        editProjectIdea: async (id, idea) => {
            const applyLocally = () => setProjectIdeas(prev => prev.map(existing =>
                existing.id === id ? { ...idea, id } : existing
            ));

            if (isLocalIdea(id)) {
                applyLocally();
                return;
            }

            try {
                const savedIdea = await updateProjectIdeaRecord(id, idea);
                setProjectIdeas(prev => prev.map(existing =>
                    existing.id === id ? savedIdea : existing
                ));
            } catch (error) {
                applyLocally();
                showSyncError("update project idea in", error);
            }
        },
        deleteProjectIdea: async (id) => {
            const removeIdea = () => setProjectIdeas(prev => prev.filter(idea => idea.id !== id));

            if (isLocalIdea(id)) {
                removeIdea();
                return;
            }

            try {
                await deleteProjectIdeaRecord(id);
                removeIdea();
            } catch (error) {
                removeIdea();
                showSyncError("delete project idea in", error);
            }
        },
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
                // Keep the material visible: it still exists in Firestore, so
                // removing it locally would make it "reappear" on next launch.
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
            if (!request) return;

            const material = materials.find(material => material.id === request.materialId);

            // Warn (but still allow) when the approved amount exceeds stock, so
            // the admin knows the request can't actually be fully fulfilled.
            if (material && material.quantity > 0 && request.requestedQuantity > material.quantity) {
                toast.warning(
                    `Approving ${request.requestedQuantity} ${material.unit} of ${material.name}, but only ${material.quantity} ${material.unit} are in stock.`,
                );
            }

            const isLocalOnly = isLocalRequest(request.id) || (material ? isLocalMaterial(material.id) : false);

            if (!isLocalOnly) {
                try {
                    if (material) {
                        const saved = await approveMaterialRequestRecord(request, material);
                        setMaterials(prev => prev.map(existing =>
                            existing.id === material.id ? normalizeMaterialArea(saved.material) : existing
                        ));
                        setRequests(prev => prev.map(existingRequest =>
                            existingRequest.id === id ? saved.request : existingRequest
                        ));
                    } else {
                        // Material was deleted: resolve the request on the server too,
                        // otherwise the live subscription reverts it to pending.
                        const saved = await approveRequestWithoutStockRecord(request);
                        setRequests(prev => prev.map(existingRequest =>
                            existingRequest.id === id ? saved : existingRequest
                        ));
                    }
                    return;
                } catch (error) {
                    showSyncError("approve request in", error);
                    return;
                }
            }

            // Local-only request/material: this session never reached Firestore,
            // so just resolve it in memory.
            if (material) {
                const nextMaterial = {
                    ...material,
                    quantity: Math.max(0, material.quantity - request.requestedQuantity),
                };
                setMaterials(prev => prev.map(existing =>
                    existing.id === material.id ? normalizeMaterialArea(nextMaterial) : existing
                ));
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
    }), [floors, materials, requests, projectIdeas]);

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
