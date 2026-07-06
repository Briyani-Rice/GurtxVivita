import { Tab } from "../types.ts";
import { RoomMap } from "./RoomMap";
import {
    vivitaFloor,
    vivitaMaterials,
} from "./roomMapData";

export class RoomMapTab implements Tab {
    id = crypto.randomUUID();
    name = "Room map";
    content = (
        <div style={{ width: "100%", height: "100%" }}>
            <RoomMap
                floors={[vivitaFloor]}
                materials={vivitaMaterials}
                onCompartmentClick={(areaId) => {
                    console.log("Selected room map area:", areaId);
                }}
            />
        </div>
    );
}

export default RoomMapTab;
