import type { Tab } from "../types.ts";
import { AdminView } from "./AdminView";
import { useInventory } from "./InventoryProvider";

function AdminViewTabContent() {
    const inventory = useInventory();

    return (
        <AdminView
            floors={inventory.floors}
            onFloorsChange={inventory.setFloors}
            compartments={inventory.compartments}
            materials={inventory.materials}
            requests={inventory.requests}
            makerItems={inventory.makerItems}
            projectIdeas={inventory.projectIdeas}
            onAddMaterial={inventory.addMaterial}
            onEditMaterial={inventory.editMaterial}
            onDeleteMaterial={inventory.deleteMaterial}
            onAddProjectIdea={inventory.addProjectIdea}
            onEditProjectIdea={inventory.editProjectIdea}
            onDeleteProjectIdea={inventory.deleteProjectIdea}
            onApproveRequest={inventory.approveRequest}
            onDeclineRequest={inventory.declineRequest}
            getterEmptyMaterials={inventory.getEmptyMaterials}
        />
    );
}

export class AdminViewTab implements Tab {
    id = crypto.randomUUID();
    name = "Admin View";
    content = <AdminViewTabContent />;
}

export default AdminViewTab;
