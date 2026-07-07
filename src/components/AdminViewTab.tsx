import { useEffect, useState } from "react";
import type { Compartment, FloorData, Material, MaterialRequest, Tab } from "../types.ts";
import { AdminView } from "./AdminView";
import {
    createMaterialRecord,
    deleteMaterialRecord,
    listMaterialRecords,
    updateMaterialRecord,
    type MaterialInput,
} from "../services/pocketbaseMaterials";

const initialFloors: FloorData[] = [
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
        ],
    },
];

const initialCompartments: Compartment[] = [
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
];

const initialMaterials: Material[] = [
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
        description: "Dell Latitude",
        quantity: 6,
        unit: "units",
        compartmentId: "comp-102",
        createdAt: new Date().toISOString(),
    },
    {
        id: "mat-3",
        name: "Projector",
        description: "Conference projector",
        quantity: 0,
        unit: "unit",
        compartmentId: "comp-201",
        createdAt: new Date().toISOString(),
    },
];

const initialRequests: MaterialRequest[] = [
    {
        id: "req-1",
        materialId: "mat-1",
        materialName: "HDMI Cable",
        requestedQuantity: 2,
        reason: "Needed for classroom presentation",
        status: "pending",
        createdAt: new Date().toISOString(),
    },
    {
        id: "req-2",
        materialId: "mat-2",
        materialName: "Laptop",
        requestedQuantity: 1,
        reason: "Temporary replacement",
        status: "pending",
        createdAt: new Date().toISOString(),
    },
];

function AdminViewTabContent() {
    const [floors, setFloors] = useState<FloorData[]>(initialFloors);
    const [materials, setMaterials] = useState<Material[]>(initialMaterials);
    const [requests, setRequests] = useState<MaterialRequest[]>(initialRequests);

    useEffect(() => {
        let isMounted = true;

        listMaterialRecords()
            .then(savedMaterials => {
                if (isMounted) {
                    setMaterials(savedMaterials);
                }
            })
            .catch(error => {
                console.warn("Unable to load PocketBase materials; using starter data.", error);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const showSyncError = (action: string, error: unknown) => {
        console.error(`Unable to ${action} material in PocketBase`, error);
        alert(`Unable to ${action} material. Check that PocketBase is running and the materials collection exists.`);
    };

    const toMaterialInput = (material: Material): MaterialInput => ({
        name: material.name,
        description: material.description,
        quantity: material.quantity,
        unit: material.unit,
        compartmentId: material.compartmentId,
    });

    return (
        <AdminView
            floors={floors}
            onFloorsChange={setFloors}
            compartments={initialCompartments}
            materials={materials}
            requests={requests}
            onAddMaterial={async (material) => {
                try {
                    const savedMaterial = await createMaterialRecord(material);
                    setMaterials(prev => [savedMaterial, ...prev]);
                } catch (error) {
                    showSyncError("add", error);
                }
            }}
            onEditMaterial={async (id, material) => {
                try {
                    const savedMaterial = await updateMaterialRecord(id, material);
                    setMaterials(prev => prev.map(existing =>
                        existing.id === id ? savedMaterial : existing
                    ));
                } catch (error) {
                    showSyncError("update", error);
                }
            }}
            onDeleteMaterial={async (id) => {
                try {
                    await deleteMaterialRecord(id);
                    setMaterials(prev => prev.filter(material => material.id !== id));
                } catch (error) {
                    showSyncError("delete", error);
                }
            }}
            onApproveRequest={async (id) => {
                const request = requests.find(request => request.id === id);

                if (request) {
                    const material = materials.find(material => material.id === request.materialId);

                    if (material) {
                        const nextMaterial = {
                            ...material,
                            quantity: Math.max(0, material.quantity - request.requestedQuantity),
                        };

                        try {
                            const savedMaterial = await updateMaterialRecord(
                                material.id,
                                toMaterialInput(nextMaterial),
                            );
                            setMaterials(prev => prev.map(existing =>
                                existing.id === material.id ? savedMaterial : existing
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
            }}
            onDeclineRequest={(id) => {
                setRequests(prev => prev.map(request =>
                    request.id === id
                        ? {
                            ...request,
                            status: "declined",
                            respondedAt: new Date().toISOString(),
                        }
                        : request
                ));
            }}
            getterEmptyMaterials={() => materials.filter((m) => m.quantity <= 0)}
        />
    );
}

export class AdminViewTab implements Tab {
    id = crypto.randomUUID();
    name = "Admin View";
    content = <AdminViewTabContent />;
}

export default AdminViewTab;
