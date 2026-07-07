import type { Tab } from "../types.ts";
import { RoomMap } from "./RoomMap";
import { useInventory } from "./InventoryProvider";

function RoomMapTabContent() {
    const inventory = useInventory();

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <RoomMap
                floors={inventory.floors}
                materials={inventory.materials}
                onCompartmentClick={(areaId) => {
                    console.log("Selected room map area:", areaId);
                }}
            />
        </div>
    );
}

export class RoomMapTab implements Tab {
    id = crypto.randomUUID();
    name = "Room map";
    content = <RoomMapTabContent />;
}

export default RoomMapTab;
