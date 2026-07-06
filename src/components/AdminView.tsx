import { type CSSProperties, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    Edit2,
    GripVertical,
    Inbox,
    Package,
    Plus,
    Trash2,
    XCircle,
} from 'lucide-react';
import { Material, Compartment, MaterialRequest, FloorData } from '../types';
import { MaterialDialog } from './MaterialDialog';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from './ui/resizable';

interface AdminViewProps {
    floors: FloorData[];
    onFloorsChange: (floors: FloorData[]) => void;
    compartments: Compartment[];
    materials: Material[];
    requests: MaterialRequest[];
    onAddMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => void;
    onEditMaterial: (id: string, material: Omit<Material, 'id' | 'createdAt'>) => void;
    onDeleteMaterial: (id: string) => void;
    onApproveRequest: (id: string) => void;
    onDeclineRequest: (id: string) => void;
    getterEmptyMaterials: () => Material[];
}

const styles: Record<string, CSSProperties> = {
    shell: {
        boxSizing: 'border-box',
        height: '100%',
        minHeight: 0,
        padding: 20,
        background:
            'radial-gradient(var(--viventory-welcome-dot) 1.2px, transparent 1.2px), linear-gradient(135deg, var(--viventory-welcome-bg), var(--viventory-bg))',
        backgroundSize: '22px 22px, auto',
        color: 'var(--viventory-text)',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
    },
    eyebrow: {
        margin: 0,
        color: 'var(--viventory-welcome-accent)',
        fontSize: 13,
        fontWeight: 850,
        letterSpacing: 0,
        textTransform: 'uppercase',
    },
    title: {
        margin: '4px 0 0',
        fontSize: 28,
        lineHeight: 1.1,
        fontWeight: 850,
        letterSpacing: 0,
    },
    stats: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    stat: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 38,
        padding: '8px 11px',
        border: '1px solid var(--viventory-border)',
        borderRadius: 8,
        background: 'var(--viventory-welcome-card)',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.1)',
        fontSize: 14,
        fontWeight: 750,
        whiteSpace: 'nowrap',
    },
    panelGroup: {
        height: 'calc(100% - 74px)',
        minHeight: 520,
        border: '1px solid var(--viventory-border)',
        borderRadius: 8,
        background: 'var(--viventory-surface)',
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.14)',
    },
    workspace: {
        display: 'grid',
        gridTemplateColumns: 'minmax(190px, 250px) minmax(0, 1fr)',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
    },
    areaRail: {
        borderRight: '1px solid var(--viventory-border)',
        background: 'var(--viventory-muted-surface)',
        padding: 14,
        overflow: 'auto',
    },
    sectionLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '0 0 10px',
        color: 'var(--viventory-muted-text)',
        fontSize: 13,
        fontWeight: 750,
        letterSpacing: 0,
        textTransform: 'uppercase',
    },
    areaList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    contentPane: {
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        padding: 18,
    },
    paneHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        paddingBottom: 14,
        borderBottom: '1px solid var(--viventory-border)',
    },
    paneTitle: {
        margin: 0,
        fontSize: 22,
        fontWeight: 750,
        letterSpacing: 0,
    },
    paneMeta: {
        margin: '4px 0 0',
        color: 'var(--viventory-muted-text)',
        fontSize: 14,
        lineHeight: 1.35,
    },
    list: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: 12,
        paddingTop: 14,
        overflow: 'auto',
        minHeight: 0,
    },
    materialCard: {
        border: '1px solid var(--viventory-border)',
        borderRadius: 8,
        background: 'var(--viventory-surface)',
        padding: 16,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
    },
    materialName: {
        margin: 0,
        fontSize: 16,
        fontWeight: 750,
        lineHeight: 1.2,
    },
    materialDescription: {
        margin: '6px 0 0',
        color: 'var(--viventory-muted-text)',
        fontSize: 13,
        lineHeight: 1.35,
    },
    quantity: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        padding: '5px 8px',
        borderRadius: 8,
        background: 'var(--viventory-muted-surface)',
        color: 'var(--viventory-text)',
        fontSize: 13,
        fontWeight: 750,
    },
    cardActions: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    sidePane: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: 'var(--viventory-muted-surface)',
        overflow: 'hidden',
    },
    sideSection: {
        padding: 16,
        borderBottom: '1px solid var(--viventory-border)',
    },
    sideScroll: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 16,
        overflow: 'auto',
        minHeight: 0,
    },
    requestCard: {
        border: '1px solid var(--viventory-border)',
        borderRadius: 8,
        background: 'var(--viventory-surface)',
        padding: 12,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
    },
    requestTop: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        alignItems: 'flex-start',
    },
    requestName: {
        margin: 0,
        fontSize: 15,
        fontWeight: 750,
        lineHeight: 1.25,
    },
    requestMeta: {
        margin: '5px 0 0',
        color: 'var(--viventory-muted-text)',
        fontSize: 13,
        lineHeight: 1.35,
    },
    requestActions: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        marginTop: 12,
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 180,
        border: '1px dashed var(--viventory-border)',
        borderRadius: 8,
        color: 'var(--viventory-muted-text)',
        textAlign: 'center',
        padding: 20,
    },
    resizeHandle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 12,
        background: 'var(--viventory-welcome-accent)',
        color: '#1f1300',
        cursor: 'col-resize',
        borderLeft: '1px solid var(--viventory-border)',
        borderRight: '1px solid var(--viventory-border)',
    },
};

const makeAreaButtonStyle = (active: boolean): CSSProperties => ({
    width: '100%',
    border: active ? '2px solid var(--viventory-tab-active-border)' : '1px solid var(--viventory-border)',
    borderRadius: 8,
    background: active ? 'var(--viventory-active-tab)' : 'var(--viventory-surface)',
    color: 'var(--viventory-text)',
    padding: '10px 11px',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: active ? '0 12px 28px rgba(15, 23, 42, 0.12)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
});

const makeButtonStyle = (variant: 'primary' | 'ghost' | 'approve' | 'decline'): CSSProperties => {
    const base: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderRadius: 8,
        border: '1px solid transparent',
        minHeight: 36,
        padding: '8px 11px',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    };

    if (variant === 'primary') {
        return {
            ...base,
            background: 'linear-gradient(135deg, var(--viventory-welcome-accent), var(--viventory-welcome-accent-2))',
            borderColor: 'transparent',
            color: '#1f1300'
        };
    }

    if (variant === 'approve') {
        return { ...base, background: 'rgba(34, 197, 94, 0.14)', borderColor: 'rgba(34, 197, 94, 0.28)', color: '#047857' };
    }

    if (variant === 'decline') {
        return { ...base, background: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' };
    }

    return { ...base, background: 'var(--viventory-surface)', borderColor: 'var(--viventory-border)', color: 'var(--viventory-text)', minWidth: 36, padding: 8 };
};

const makeStockPillStyle = (quantity: number): CSSProperties => ({
    ...styles.quantity,
    background: quantity <= 0 ? 'rgba(239, 111, 77, 0.14)' : quantity <= 2 ? 'rgba(245, 158, 11, 0.16)' : 'rgba(45, 120, 152, 0.12)',
    color: quantity <= 0 ? 'var(--viventory-welcome-accent-2)' : quantity <= 2 ? 'var(--viventory-welcome-accent)' : 'var(--viventory-text)',
});

export function AdminView({
                              floors: _floors,
                              onFloorsChange: _onFloorsChange,
                              compartments,
                              materials,
                              requests,
                              onAddMaterial,
                              onEditMaterial,
                              onDeleteMaterial,
                              onApproveRequest,
                              onDeclineRequest,
                              getterEmptyMaterials,
                          }: AdminViewProps) {
    const [selectedElement, setSelectedElement] = useState<string | null>(
        compartments[0]?.id ?? null
    );
    const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

    const selectedCompartment: Compartment | null =
        compartments.find(c => c.id === selectedElement) ?? null;

    const compartmentMaterials = materials.filter(
        m => m.compartmentId === selectedElement
    );

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const emptyMaterials  = getterEmptyMaterials();

    const handleSaveMaterial = (data: Omit<Material, 'id' | 'createdAt'>) => {
        if (editingMaterial) {
            onEditMaterial(editingMaterial.id, data);
            setEditingMaterial(null);
        } else {
            onAddMaterial(data);
        }
    };

    const openAddMaterial = () => {
        setEditingMaterial(null);
        setIsMaterialDialogOpen(true);
    };

    return (
        <div style={styles.shell}>
            <div style={styles.header}>
                <div>
                    <p style={styles.eyebrow}>Makerspace operations</p>
                    <h2 style={styles.title}>Inventory Workspace</h2>
                </div>

                <div style={styles.stats} aria-label="Admin inventory summary">
                    <div style={styles.stat}>
                        <Package size={17} />
                        {materials.length} materials
                    </div>
                    <div style={styles.stat}>
                        <Inbox size={17} />
                        {pendingRequests.length} pending
                    </div>
                    <div style={styles.stat}>
                        <AlertTriangle size={17} />
                        {emptyMaterials.length} out of stock
                    </div>
                </div>
            </div>

            <ResizablePanelGroup orientation="horizontal" style={styles.panelGroup}>
                <ResizablePanel defaultSize={66} minSize={45}>
                    <div style={styles.workspace}>
                        <aside style={styles.areaRail} aria-label="Storage areas">
                            <p style={styles.sectionLabel}>
                                <Package size={15} />
                                Areas
                            </p>

                            <div style={styles.areaList}>
                                {compartments.map(compartment => {
                                    const areaMaterials = materials.filter(m => m.compartmentId === compartment.id);
                                    const active = selectedElement === compartment.id;

                                    return (
                                        <button
                                            key={compartment.id}
                                            type="button"
                                            onClick={() => setSelectedElement(compartment.id)}
                                            style={makeAreaButtonStyle(active)}
                                        >
                                            <div style={{ fontSize: 14, fontWeight: 750 }}>
                                                {compartment.number}
                                            </div>
                                            <div style={{ marginTop: 2, fontSize: 13, color: 'var(--viventory-muted-text)' }}>
                                                {compartment.name}
                                            </div>
                                            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--viventory-muted-text)' }}>
                                                {areaMaterials.length} material{areaMaterials.length === 1 ? '' : 's'}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </aside>

                        <main style={styles.contentPane}>
                            <div style={styles.paneHeader}>
                                <div>
                                    <h3 style={styles.paneTitle}>
                                        {selectedCompartment
                                            ? `${selectedCompartment.number} ${selectedCompartment.name}`
                                            : 'Select a storage area'}
                                    </h3>
                                    <p style={styles.paneMeta}>
                                        {selectedCompartment
                                            ? `${compartmentMaterials.length} tracked material${compartmentMaterials.length === 1 ? '' : 's'} in this area`
                                            : 'Choose an area on the left to manage its materials.'}
                                    </p>
                                </div>

                                {selectedCompartment && (
                                    <button
                                        type="button"
                                        onClick={openAddMaterial}
                                        style={makeButtonStyle('primary')}
                                    >
                                        <Plus size={17} />
                                        Add Material
                                    </button>
                                )}
                            </div>

                            <div style={styles.list}>
                                {!selectedCompartment ? (
                                    <div style={styles.emptyState}>
                                        <Package size={24} />
                                        <p style={{ margin: '10px 0 0', fontWeight: 700 }}>No area selected</p>
                                    </div>
                                ) : compartmentMaterials.length === 0 ? (
                                    <div style={styles.emptyState}>
                                        <Package size={24} />
                                        <p style={{ margin: '10px 0 0', fontWeight: 700 }}>No materials here yet</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 13 }}>Add the first item to start tracking this area.</p>
                                    </div>
                                ) : (
                                    compartmentMaterials.map(material => (
                                        <article key={material.id} style={styles.materialCard}>
                                            <div style={styles.cardHeader}>
                                                <div style={{ minWidth: 0 }}>
                                                    <h4 style={styles.materialName}>{material.name}</h4>
                                                    {material.description && (
                                                        <p style={styles.materialDescription}>{material.description}</p>
                                                    )}
                                                </div>

                                                <div style={styles.cardActions}>
                                                    <button
                                                        type="button"
                                                        aria-label={`Edit ${material.name}`}
                                                        title={`Edit ${material.name}`}
                                                        onClick={() => {
                                                            setEditingMaterial(material);
                                                            setIsMaterialDialogOpen(true);
                                                        }}
                                                        style={makeButtonStyle('ghost')}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label={`Delete ${material.name}`}
                                                        title={`Delete ${material.name}`}
                                                        onClick={() => {
                                                            if (confirm('Delete this material?')) onDeleteMaterial(material.id);
                                                        }}
                                                        style={makeButtonStyle('ghost')}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={makeStockPillStyle(material.quantity)}>
                                                {material.quantity <= 0
                                                    ? 'Out of stock'
                                                    : `Ready to lend: ${material.quantity} ${material.unit}`}
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        </main>
                    </div>
                </ResizablePanel>

                <ResizableHandle style={styles.resizeHandle} aria-label="Adjust panel widths">
                    <GripVertical size={16} />
                </ResizableHandle>

                <ResizablePanel defaultSize={34} minSize={25}>
                    <aside style={styles.sidePane}>
                        <section style={styles.sideSection}>
                            <p style={styles.sectionLabel}>
                                <Inbox size={15} />
                                Review queue
                            </p>
                            <p style={styles.paneMeta}>
                                Review requests from the user view and update stock automatically when approved.
                            </p>
                        </section>

                        <div style={styles.sideScroll}>
                            {pendingRequests.length === 0 ? (
                                <div style={styles.emptyState}>
                                    <Inbox size={24} />
                                    <p style={{ margin: '10px 0 0', fontWeight: 700 }}>No pending requests</p>
                                </div>
                            ) : (
                                pendingRequests.map(request => (
                                    <article key={request.id} style={styles.requestCard}>
                                        <div style={styles.requestTop}>
                                            <div>
                                                <h4 style={styles.requestName}>{request.materialName}</h4>
                                                <p style={styles.requestMeta}>
                                                    Qty: {request.requestedQuantity}
                                                </p>
                                            </div>
                                            <span style={makeButtonStyle('ghost')}>Pending</span>
                                        </div>

                                        {request.reason && (
                                            <p style={styles.requestMeta}>{request.reason}</p>
                                        )}

                                        <div style={styles.requestActions}>
                                            <button
                                                type="button"
                                                onClick={() => onApproveRequest(request.id)}
                                                style={makeButtonStyle('approve')}
                                            >
                                                <CheckCircle size={16} />
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeclineRequest(request.id)}
                                                style={makeButtonStyle('decline')}
                                            >
                                                <XCircle size={16} />
                                                Decline
                                            </button>
                                        </div>

                                        <p style={{ ...styles.requestMeta, marginBottom: 0 }}>
                                            {new Date(request.createdAt).toLocaleString()}
                                        </p>
                                    </article>
                                ))
                            )}
                        </div>

                        {emptyMaterials.length > 0 && (
                            <section style={styles.sideSection}>
                                <p style={styles.sectionLabel}>
                                    <AlertTriangle size={15} />
                                    Out of Stock
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {emptyMaterials.map(material => (
                                        <span key={material.id} style={makeStockPillStyle(material.quantity)}>
                                            {material.name}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}
                    </aside>
                </ResizablePanel>
            </ResizablePanelGroup>

            <MaterialDialog
                isOpen={isMaterialDialogOpen}
                onClose={() => { setIsMaterialDialogOpen(false); setEditingMaterial(null); }}
                onSave={handleSaveMaterial}
                material={editingMaterial}
                compartments={compartments}
                selectedCompartmentId={selectedElement ?? undefined}
            />
        </div>
    );
}
