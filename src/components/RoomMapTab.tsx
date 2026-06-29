import {Tab} from "../types.ts"
import {RoomMap} from "./RoomMap"

export class RoomMapTab implements Tab{
    
    id = crypto.randomUUID()
    name: string = "Room map"
    content = (<div style={{
        width:"100%",
        height:"100%",
    }}>
        <RoomMap
            floors={[
                {
                    id: 'floor-1',
                    name: 'Level 1',
                    elements: [
                        {
                            id: 'comp-101',
                            type: 'compartment',
                            x: 50,
                            y: 40,
                            width: 140,
                            height: 90,
                            number: 'A101',
                            name: 'Storage Room',
                            color: '#60a5fa',
                            label: 'Storage',
                        },
                        {
                            id: 'comp-102',
                            type: 'compartment',
                            x: 240,
                            y: 40,
                            width: 160,
                            height: 90,
                            number: 'A102',
                            name: 'Electronics Lab',
                            color: '#34d399',
                            label: 'Electronics',
                        },
                        {
                            id: 'stairs-1',
                            type: 'stairs',
                            x: 430,
                            y: 40,
                            width: 60,
                            height: 60,
                            label: 'Stairs',
                        },
                        {
                            id: 'lift-1',
                            type: 'lift',
                            x: 520,
                            y: 40,
                            width: 50,
                            height: 50,
                            label: 'Lift',
                        },
                        {
                            id: 'table-1',
                            type: 'table',
                            x: 120,
                            y: 180,
                            width: 80,
                            height: 40,
                            label: 'Table',
                        },
                        {
                            id: 'chair-1',
                            type: 'chair',
                            x: 90,
                            y: 240,
                            width: 30,
                            height: 30,
                            label: 'Chair',
                        },
                        {
                            id: 'chair-2',
                            type: 'chair',
                            x: 210,
                            y: 240,
                            width: 30,
                            height: 30,
                            label: 'Chair',
                        },
                        {
                            id: 'workplace-1',
                            type: 'workplace',
                            x: 320,
                            y: 180,
                            width: 120,
                            height: 70,
                            label: 'Workstation',
                        },
                        {
                            id: 'out-1',
                            type: 'outofbounds',
                            x: 20,
                            y: 320,
                            width: 220,
                            height: 90,
                            color: '#ef4444',
                            label: 'Restricted',
                        },
                    ],
                },
                {
                    id: 'floor-2',
                    name: 'Level 2',
                    elements: [
                        {
                            id: 'comp-201',
                            type: 'compartment',
                            x: 70,
                            y: 60,
                            width: 180,
                            height: 100,
                            number: 'B201',
                            name: 'Meeting Room',
                            color: '#fbbf24',
                            label: 'Meeting',
                        },
                        {
                            id: 'comp-202',
                            type: 'compartment',
                            x: 300,
                            y: 60,
                            width: 170,
                            height: 100,
                            number: 'B202',
                            name: 'Server Room',
                            color: '#f87171',
                            label: 'Servers',
                        },
                        {
                            id: 'table-2',
                            type: 'table',
                            x: 150,
                            y: 220,
                            width: 100,
                            height: 50,
                            label: 'Conference Table',
                        },
                        {
                            id: 'chair-3',
                            type: 'chair',
                            x: 120,
                            y: 290,
                            width: 30,
                            height: 30,
                            label: 'Chair',
                        },
                        {
                            id: 'chair-4',
                            type: 'chair',
                            x: 270,
                            y: 290,
                            width: 30,
                            height: 30,
                            label: 'Chair',
                        },
                    ],
                },
            ]}
            materials={[
                {
                    id: 'mat-1',
                    name: 'HDMI Cable',
                    description: '2m HDMI cable',
                    quantity: 12,
                    unit: 'pcs',
                    compartmentId: 'comp-101',
                    createdAt: '2026-05-25T10:00:00Z',
                },
                {
                    id: 'mat-2',
                    name: 'Laptop',
                    description: 'Dell Latitude',
                    quantity: 6,
                    unit: 'units',
                    compartmentId: 'comp-102',
                    createdAt: '2026-05-25T10:10:00Z',
                },
                {
                    id: 'mat-3',
                    name: 'Ethernet Cable',
                    description: 'Cat 6 cable',
                    quantity: 25,
                    unit: 'pcs',
                    compartmentId: 'comp-202',
                    createdAt: '2026-05-25T10:20:00Z',
                },
                {
                    id: 'mat-4',
                    name: 'Projector',
                    description: 'Meeting room projector',
                    quantity: 1,
                    unit: 'unit',
                    compartmentId: 'comp-201',
                    createdAt: '2026-05-25T10:30:00Z',
                },
            ]}
            selectedCompartment={{
                id: 'comp-101',
                number: 'A101',
                name: 'Storage Room',
                x: 50,
                y: 40,
                width: 140,
                height: 90,
                color: '#60a5fa',
            }}
            //@ts-ignore
            onCompartmentClick={(compartment) => {
                console.log('Clicked:', compartment);
            }}
            isAdmin={true}
            floorplanImage="https://via.placeholder.com/1200x800"
            onFloorplanUpload={(file) => {
                console.log('Uploaded floorplan:', file);
            }}
        />
    </div>)
}
export default RoomMapTab;