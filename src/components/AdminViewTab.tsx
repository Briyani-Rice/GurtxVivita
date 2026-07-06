import { useState } from "react";
import type { Compartment, FloorData, Material, MaterialRequest, Tab } from "../types.ts";
import { AdminView } from "./AdminView";

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
                color: "#fbbf24",
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
        color: "#fbbf24",
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

    return (
        <AdminView
            floors={floors}
            onFloorsChange={setFloors}
            compartments={initialCompartments}
            materials={materials}
            requests={requests}
            onAddMaterial={(material) => {
                setMaterials(prev => [
                    ...prev,
                    {
                        ...material,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                    },
                ]);
            }}
            onEditMaterial={(id, material) => {
                setMaterials(prev => prev.map(existing =>
                    existing.id === id
                        ? { ...existing, ...material }
                        : existing
                ));
            }}
            onDeleteMaterial={(id) => {
                setMaterials(prev => prev.filter(material => material.id !== id));
            }}
            onApproveRequest={(id) => {
                const request = requests.find(request => request.id === id);

                if (request) {
                    setMaterials(prev => prev.map(material =>
                        material.id === request.materialId
                            ? {
                                ...material,
                                quantity: Math.max(0, material.quantity - request.requestedQuantity),
                            }
                            : material
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
