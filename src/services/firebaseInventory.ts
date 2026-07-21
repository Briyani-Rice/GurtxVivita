import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    updateDoc,
    type DocumentData,
    type Firestore,
    type QueryDocumentSnapshot,
    type Timestamp,
} from "firebase/firestore";
import type { Material, MaterialRequest } from "../types";
import { getFirebaseFirestore } from "./firebaseApp";

export type MaterialInput = Omit<Material, "id" | "createdAt">;
export type MaterialRequestInput = Omit<MaterialRequest, "id" | "createdAt" | "status" | "respondedAt">;

export const MATERIALS_COLLECTION = "materials";
export const REQUESTS_COLLECTION = "materialRequests";

function getInventoryDb(): Firestore {
    return getFirebaseFirestore();
}

function toIsoDate(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    if (value && typeof value === "object" && "toDate" in value) {
        return (value as Timestamp).toDate().toISOString();
    }

    return new Date().toISOString();
}

function toMaterial(snapshot: QueryDocumentSnapshot<DocumentData> | { id: string; data: () => DocumentData }): Material {
    const data = snapshot.data();

    return {
        id: snapshot.id,
        name: String(data.name ?? ""),
        description: String(data.description ?? ""),
        quantity: Number(data.quantity ?? 0),
        unit: String(data.unit ?? "pcs"),
        compartmentId: String(data.compartmentId ?? ""),
        createdAt: toIsoDate(data.createdAt),
    };
}

function toMaterialRequest(snapshot: QueryDocumentSnapshot<DocumentData> | { id: string; data: () => DocumentData }): MaterialRequest {
    const data = snapshot.data();
    const status = String(data.status ?? "pending");

    return {
        id: snapshot.id,
        materialId: String(data.materialId ?? ""),
        materialName: String(data.materialName ?? ""),
        requestedQuantity: Number(data.requestedQuantity ?? 1),
        reason: String(data.reason ?? "No reason provided"),
        status: status === "approved" || status === "declined" || status === "returned"
            ? status
            : "pending",
        createdAt: toIsoDate(data.createdAt),
        respondedAt: data.respondedAt ? toIsoDate(data.respondedAt) : undefined,
        comments: typeof data.comments === "string" ? data.comments : undefined,
    };
}

export async function listMaterialRecords(): Promise<Material[]> {
    const db = getInventoryDb();
    const snapshot = await getDocs(query(
        collection(db, MATERIALS_COLLECTION),
        orderBy("createdAt", "desc"),
    ));

    return snapshot.docs.map(toMaterial);
}

export async function createMaterialRecord(material: MaterialInput): Promise<Material> {
    const db = getInventoryDb();
    const createdAt = new Date().toISOString();
    const record = {
        ...material,
        createdAt,
    };
    const ref = await addDoc(collection(db, MATERIALS_COLLECTION), record);

    return {
        id: ref.id,
        ...record,
    };
}

export async function updateMaterialRecord(id: string, material: MaterialInput): Promise<Material> {
    const db = getInventoryDb();
    const ref = doc(db, MATERIALS_COLLECTION, id);

    await updateDoc(ref, material);

    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
        throw new Error(`Material ${id} was updated but could not be read back.`);
    }

    return toMaterial({ id: snapshot.id, data: () => snapshot.data() });
}

export async function deleteMaterialRecord(id: string): Promise<void> {
    const db = getInventoryDb();

    await deleteDoc(doc(db, MATERIALS_COLLECTION, id));
}

export async function listMaterialRequestRecords(): Promise<MaterialRequest[]> {
    const db = getInventoryDb();
    const snapshot = await getDocs(query(
        collection(db, REQUESTS_COLLECTION),
        orderBy("createdAt", "desc"),
    ));

    return snapshot.docs.map(toMaterialRequest);
}

export async function createMaterialRequestRecord(request: MaterialRequestInput): Promise<MaterialRequest> {
    const db = getInventoryDb();
    const createdAt = new Date().toISOString();
    const record = {
        ...request,
        requestedQuantity: Number.isFinite(request.requestedQuantity)
            ? Math.max(1, Math.round(request.requestedQuantity))
            : 1,
        reason: request.reason.trim() || "No reason provided",
        status: "pending" as const,
        createdAt,
    };
    const ref = await addDoc(collection(db, REQUESTS_COLLECTION), record);

    return {
        id: ref.id,
        ...record,
    };
}

export async function approveMaterialRequestRecord(
    request: MaterialRequest,
    material: Material,
): Promise<{ material: Material; request: MaterialRequest }> {
    const db = getInventoryDb();
    const materialRef = doc(db, MATERIALS_COLLECTION, material.id);
    const requestRef = doc(db, REQUESTS_COLLECTION, request.id);
    const respondedAt = new Date().toISOString();

    const nextMaterial = await runTransaction(db, async transaction => {
        const materialSnapshot = await transaction.get(materialRef);
        const currentQuantity = materialSnapshot.exists()
            ? Number(materialSnapshot.data().quantity ?? material.quantity)
            : material.quantity;
        const quantity = Math.max(0, currentQuantity - request.requestedQuantity);

        transaction.update(materialRef, { quantity });
        transaction.update(requestRef, {
            status: "approved",
            respondedAt,
            respondedAtServer: serverTimestamp(),
        });

        return {
            ...material,
            quantity,
        };
    });

    return {
        material: nextMaterial,
        request: {
            ...request,
            status: "approved",
            respondedAt,
        },
    };
}

export async function declineMaterialRequestRecord(request: MaterialRequest): Promise<MaterialRequest> {
    const db = getInventoryDb();
    const respondedAt = new Date().toISOString();

    await updateDoc(doc(db, REQUESTS_COLLECTION, request.id), {
        status: "declined",
        respondedAt,
        respondedAtServer: serverTimestamp(),
    });

    return {
        ...request,
        status: "declined",
        respondedAt,
    };
}
