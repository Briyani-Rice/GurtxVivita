import type { Tab } from "../types";
import { UserView } from "../components/UserView";
import { useInventory } from "./InventoryProvider";

function UserViewTabContent({ initialMaterialSearch = "" }: { initialMaterialSearch?: string }) {
    const inventory = useInventory();

    return (
        <UserView
            floors={inventory.floors}
            materials={inventory.materials}
            requests={inventory.requests}
            initialTab={initialMaterialSearch.trim() ? "materials" : "map"}
            initialMaterialSearch={initialMaterialSearch}
            onSubmitRequest={inventory.submitRequest}
            prefs={{
                hideOutOfStock: false,
                compactCards: false,
                defaultFloor: 0,
            }}
        />
    );
}

export class UserViewTab implements Tab {
    id: string = crypto.randomUUID();
    name: string = "User View";
    content: React.ReactNode;

    constructor(initialMaterialSearch: string = "") {
        this.content = <UserViewTabContent initialMaterialSearch={initialMaterialSearch} />;
    }
}
