import {
    Tab,
    FloorData,
    Material,
    MaterialRequest,
} from "../types";

import { UserView } from "../components/UserView";

export class UserViewTab implements Tab {
    id: string = crypto.randomUUID();

    name: string = "User View";

    private floors: FloorData[] = [
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
                    color: "#fbbf24",
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

    private materials: Material[] = [
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
            name: "Ethernet Cable",
            description: "Cat 6 networking cable",
            quantity: 0,
            unit: "pcs",
            compartmentId: "comp-202",
            createdAt: new Date().toISOString(),
        },
        {
            id: "mat-4",
            name: "Projector",
            description: "Portable projector",
            quantity: 2,
            unit: "units",
            compartmentId: "comp-201",
            createdAt: new Date().toISOString(),
        },
    ];

    private requests: MaterialRequest[] = [
        {
            id: "req-1",
            materialId: "mat-2",
            materialName: "Laptop",
            requestedQuantity: 1,
            reason: "For presentation",
            status: "pending",
            createdAt: new Date().toISOString(),
        },
    ];

    content: React.ReactNode = (
        <UserView
            floors={this.floors}
            materials={this.materials}
            requests={this.requests}
            onSubmitRequest={(materialId, quantity, reason) => {
                console.log("Request submitted:", {
                    materialId,
                    quantity,
                    reason,
                });
            }}
            prefs={{
                hideOutOfStock: false,
                compactCards: false,
                defaultFloor:0
            }}
        />
    );
}