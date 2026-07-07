import PocketBase from "pocketbase";
import type { Material } from "../types";

export type MaterialInput = Omit<Material, "id" | "createdAt">;

type PocketBaseRecord = {
    id: string;
    created?: string;
    createdAt?: string;
    name?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    compartmentId?: string;
};

type PocketBaseCollection = {
    getFullList: (options?: { sort?: string }) => Promise<PocketBaseRecord[]>;
    create: (data: MaterialInput) => Promise<PocketBaseRecord>;
    update: (id: string, data: MaterialInput) => Promise<PocketBaseRecord>;
    delete: (id: string) => Promise<unknown>;
};

export type PocketBaseMaterialClient = {
    collection: (name: string) => PocketBaseCollection;
};

export const MATERIALS_COLLECTION = "materials";

const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
const pocketBaseUrl =
    viteEnv?.VITE_POCKETBASE_URL?.trim() || "http://127.0.0.1:8090";

export const pocketBaseMaterialClient = new PocketBase(pocketBaseUrl);

function toMaterial(record: PocketBaseRecord): Material {
    return {
        id: record.id,
        name: record.name ?? "",
        description: record.description ?? "",
        quantity: Number(record.quantity ?? 0),
        unit: record.unit ?? "pcs",
        compartmentId: record.compartmentId ?? "",
        createdAt: record.createdAt ?? record.created ?? new Date().toISOString(),
    };
}

export async function listMaterialRecords(
    client: PocketBaseMaterialClient = pocketBaseMaterialClient,
): Promise<Material[]> {
    const records = await client
        .collection(MATERIALS_COLLECTION)
        .getFullList({ sort: "-created" });

    return records.map(toMaterial);
}

export async function createMaterialRecord(
    client: PocketBaseMaterialClient,
    material: MaterialInput,
): Promise<Material>;
export async function createMaterialRecord(
    material: MaterialInput,
): Promise<Material>;
export async function createMaterialRecord(
    clientOrMaterial: PocketBaseMaterialClient | MaterialInput,
    maybeMaterial?: MaterialInput,
): Promise<Material> {
    const client = maybeMaterial ? clientOrMaterial as PocketBaseMaterialClient : pocketBaseMaterialClient;
    const material = maybeMaterial ?? clientOrMaterial as MaterialInput;
    const record = await client.collection(MATERIALS_COLLECTION).create(material);

    return toMaterial(record);
}

export async function updateMaterialRecord(
    client: PocketBaseMaterialClient,
    id: string,
    material: MaterialInput,
): Promise<Material>;
export async function updateMaterialRecord(
    id: string,
    material: MaterialInput,
): Promise<Material>;
export async function updateMaterialRecord(
    clientOrId: PocketBaseMaterialClient | string,
    idOrMaterial: string | MaterialInput,
    maybeMaterial?: MaterialInput,
): Promise<Material> {
    const client = maybeMaterial ? clientOrId as PocketBaseMaterialClient : pocketBaseMaterialClient;
    const id = maybeMaterial ? idOrMaterial as string : clientOrId as string;
    const material = maybeMaterial ?? idOrMaterial as MaterialInput;
    const record = await client.collection(MATERIALS_COLLECTION).update(id, material);

    return toMaterial(record);
}

export async function deleteMaterialRecord(
    client: PocketBaseMaterialClient,
    id: string,
): Promise<void>;
export async function deleteMaterialRecord(id: string): Promise<void>;
export async function deleteMaterialRecord(
    clientOrId: PocketBaseMaterialClient | string,
    maybeId?: string,
): Promise<void> {
    const client = maybeId ? clientOrId as PocketBaseMaterialClient : pocketBaseMaterialClient;
    const id = maybeId ?? clientOrId as string;

    await client.collection(MATERIALS_COLLECTION).delete(id);
}
