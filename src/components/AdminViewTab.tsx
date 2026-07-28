import { useEffect, useState } from "react";
import { Tab, UserPerms } from "../types.ts";
import { AdminView } from "./AdminView";
import { useInventory } from "./InventoryProvider";
import {
    ACCOUNT_SESSION_EVENT,
    loadCurrentAccount,
} from "../services/accountSession";
import { useI18n } from "../i18n/i18n";

function useIsStaff(): boolean {
    const [isStaff, setIsStaff] = useState(
        () => loadCurrentAccount()?.perms === UserPerms.Staff,
    );

    useEffect(() => {
        const refresh = () => setIsStaff(loadCurrentAccount()?.perms === UserPerms.Staff);

        window.addEventListener(ACCOUNT_SESSION_EVENT, refresh);
        window.addEventListener("storage", refresh);

        return () => {
            window.removeEventListener(ACCOUNT_SESSION_EVENT, refresh);
            window.removeEventListener("storage", refresh);
        };
    }, []);

    return isStaff;
}

function AdminLockedNotice() {
    const { t } = useI18n();

    return (
        <div
            style={{
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: 24,
                textAlign: "center",
                background: "var(--viventory-bg)",
                color: "var(--viventory-text)",
            }}
        >
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{t("admin.lockedTitle")}</h2>
            <p style={{ margin: 0, maxWidth: 420, color: "var(--viventory-muted-text)", lineHeight: 1.5 }}>
                {t("admin.lockedBody")}
            </p>
            <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("viventory:open-login"))}
                style={{
                    border: "none",
                    borderRadius: 6,
                    background: "var(--viventory-welcome-accent)",
                    color: "#1f1300",
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontWeight: 800,
                }}
            >
                {t("login.button")}
            </button>
        </div>
    );
}

function AdminViewTabContent() {
    const inventory = useInventory();
    const isStaff = useIsStaff();

    if (!isStaff) {
        return <AdminLockedNotice />;
    }

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
