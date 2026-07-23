import { type CSSProperties, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    Edit2,
    GripVertical,
    Inbox,
    Lightbulb,
    MapPin,
    Package,
    Plus,
    Search,
    Trash2,
    XCircle,
} from 'lucide-react';
import { Material, Compartment, MaterialRequest, FloorData } from '../types';
import { MaterialDialog } from './MaterialDialog';
import { ProjectIdeaDialog } from './ProjectIdeaDialog';
import { materialRequiresAdultSupervision } from './inventoryStore';
import type { MakerItem, MakerProjectIdea } from './makerspaceData';
import type { ProjectIdeaInput } from '../services/firebaseInventory';
import { isMaterialAvailable } from '../utils/materialDetails';
import { translateDifficulty, translatedStockLabel, useI18n } from '../i18n/i18n';
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
    makerItems: MakerItem[];
    projectIdeas: MakerProjectIdea[];
    onAddMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => void;
    onEditMaterial: (id: string, material: Omit<Material, 'id' | 'createdAt'>) => void;
    onDeleteMaterial: (id: string) => void;
    onAddProjectIdea: (idea: ProjectIdeaInput) => void;
    onEditProjectIdea: (id: string, idea: ProjectIdeaInput) => void;
    onDeleteProjectIdea: (id: string) => void;
    onApproveRequest: (id: string) => void;
    onDeclineRequest: (id: string) => void;
    getterEmptyMaterials: () => Material[];
}

type MaterialSortMode = 'name-asc' | 'name-desc' | 'quantity-desc' | 'quantity-asc';
type StockFilterMode = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type SafetyFilterMode = 'all' | 'adult' | 'standard';

const styles: Record<string, CSSProperties> = {
    shell: {
        boxSizing: 'border-box',
        height: '100%',
        minHeight: 0,
        padding: 20,
        background: 'var(--viventory-bg)',
        color: 'var(--viventory-text)',
        fontFamily: '"SF Pro Text", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
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
        fontWeight: 750,
        letterSpacing: 0,
        textTransform: 'uppercase',
    },
    title: {
        margin: '4px 0 0',
        fontSize: 28,
        lineHeight: 1.1,
        fontWeight: 750,
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
        borderRadius: 4,
        background: 'var(--viventory-welcome-card)',
        boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
        fontSize: 14,
        fontWeight: 700,
        whiteSpace: 'nowrap',
    },
    panelGroup: {
        height: 'calc(100% - 74px)',
        minHeight: 520,
        border: '1px solid var(--viventory-border)',
        borderRadius: 4,
        background: 'var(--viventory-surface)',
        overflow: 'hidden',
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.1)',
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
        fontWeight: 700,
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
        fontWeight: 700,
        letterSpacing: 0,
    },
    paneMeta: {
        margin: '4px 0 0',
        color: 'var(--viventory-muted-text)',
        fontSize: 14,
        lineHeight: 1.35,
    },
    controls: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 10,
        padding: '14px 0',
        borderBottom: '1px solid var(--viventory-border)',
    },
    controlField: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
    },
    controlLabel: {
        color: 'var(--viventory-muted-text)',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0,
        textTransform: 'uppercase',
    },
    controlInputWrap: {
        position: 'relative',
        minWidth: 0,
    },
    controlInput: {
        width: '100%',
        minHeight: 38,
        boxSizing: 'border-box',
        border: '1px solid var(--viventory-border)',
        borderRadius: 4,
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        padding: '8px 10px',
        fontSize: 13,
        fontWeight: 650,
        outline: 'none',
    },
    searchInput: {
        width: '100%',
        minHeight: 38,
        boxSizing: 'border-box',
        border: '1px solid var(--viventory-border)',
        borderRadius: 4,
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        padding: '8px 10px 8px 34px',
        fontSize: 13,
        fontWeight: 650,
        outline: 'none',
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
        borderRadius: 4,
        background: 'var(--viventory-surface)',
        padding: 16,
        boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)',
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
        fontWeight: 700,
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
        borderRadius: 4,
        background: 'var(--viventory-muted-surface)',
        color: 'var(--viventory-text)',
        fontSize: 13,
        fontWeight: 700,
    },
    cardFooter: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 10,
    },
    subtlePill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 8px',
        border: '1px solid var(--viventory-border)',
        borderRadius: 4,
        background: 'var(--viventory-muted-surface)',
        color: 'var(--viventory-muted-text)',
        fontSize: 12,
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
        borderRadius: 4,
        background: 'var(--viventory-surface)',
        padding: 12,
        boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)',
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
        fontWeight: 700,
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
        borderRadius: 4,
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
    borderRadius: 4,
    background: active ? 'var(--viventory-active-tab)' : 'var(--viventory-surface)',
    color: 'var(--viventory-text)',
    padding: '10px 11px',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: active ? '0 8px 18px rgba(15, 23, 42, 0.1)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
});

const makeButtonStyle = (variant: 'primary' | 'ghost' | 'approve' | 'decline'): CSSProperties => {
    const base: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderRadius: 4,
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
            background: 'var(--viventory-welcome-accent)',
            borderColor: 'var(--viventory-welcome-accent)',
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

const materialIsLowStock = (material: Material): boolean =>
    material.stockStatus === 'low' || (material.quantity > 0 && material.quantity <= 2);

const makeStockPillStyle = (material: Material): CSSProperties => {
    const unavailable = !isMaterialAvailable(material);
    const low = materialIsLowStock(material);

    return {
        ...styles.quantity,
        background: unavailable ? 'rgba(161, 130, 79, 0.16)' : low ? 'rgba(255, 245, 203, 0.7)' : 'rgba(51, 167, 181, 0.12)',
        color: unavailable ? 'var(--viventory-welcome-accent-2)' : low ? 'var(--viventory-welcome-accent)' : 'var(--viventory-text)',
    };
};

// Stored staff flags win; keyword inference only covers older records
// (see materialRequiresAdultSupervision in inventoryStore).
function materialNeedsAdultSupervision(material: Material): boolean {
    if (material.safetyLevel) {
        return materialRequiresAdultSupervision(material);
    }

    const text = `${material.name} ${material.description}`.toLowerCase();
    return /\b(adult|supervision|hot|solder|saw|drill|knife|cutter|3d printer|printer|laser|blade)\b/.test(text);
}

function materialMatchesStockFilter(material: Material, filter: StockFilterMode): boolean {
    if (filter === 'in-stock') return isMaterialAvailable(material);
    if (filter === 'low-stock') return materialIsLowStock(material);
    if (filter === 'out-of-stock') return !isMaterialAvailable(material);

    return true;
}

function sortMaterials(materials: Material[], sortMode: MaterialSortMode): Material[] {
    return [...materials].sort((a, b) => {
        if (sortMode === 'quantity-desc') return b.quantity - a.quantity || a.name.localeCompare(b.name);
        if (sortMode === 'quantity-asc') return a.quantity - b.quantity || a.name.localeCompare(b.name);
        if (sortMode === 'name-desc') return b.name.localeCompare(a.name);

        return a.name.localeCompare(b.name);
    });
}

export function AdminView({
                              floors: _floors,
                              onFloorsChange: _onFloorsChange,
                              compartments,
                              materials,
                              requests,
                              makerItems,
                              projectIdeas,
                              onAddMaterial,
                              onEditMaterial,
                              onDeleteMaterial,
                              onAddProjectIdea,
                              onEditProjectIdea,
                              onDeleteProjectIdea,
                              onApproveRequest,
                              onDeclineRequest,
                              getterEmptyMaterials,
                          }: AdminViewProps) {
    const [selectedElement, setSelectedElement] = useState<string | null>(
        compartments.find(compartment => compartment.id === 'tinkering-studio')?.id
            ?? compartments.find(compartment => compartment.id === 'vivi-shelving')?.id
            ?? compartments[0]?.id
            ?? null
    );
    const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [isIdeaDialogOpen, setIsIdeaDialogOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState<MakerProjectIdea | null>(null);
    const [materialSearch, setMaterialSearch] = useState('');
    const [sortMode, setSortMode] = useState<MaterialSortMode>('name-asc');
    const [stockFilter, setStockFilter] = useState<StockFilterMode>('all');
    const [safetyFilter, setSafetyFilter] = useState<SafetyFilterMode>('all');
    const { language, t } = useI18n();

    const selectedCompartment: Compartment | null =
        compartments.find(c => c.id === selectedElement) ?? null;

    const compartmentMaterials = materials.filter(
        m => m.compartmentId === selectedElement
    );

    const filteredCompartmentMaterials = useMemo(() => {
        const query = materialSearch.trim().toLowerCase();
        const filtered = compartmentMaterials.filter(material => {
            const safetyMatch = safetyFilter === 'all'
                || (safetyFilter === 'adult' && materialNeedsAdultSupervision(material))
                || (safetyFilter === 'standard' && !materialNeedsAdultSupervision(material));

            const searchMatch = !query
                || material.name.toLowerCase().includes(query)
                || material.description.toLowerCase().includes(query)
                || material.unit.toLowerCase().includes(query);

            return searchMatch
                && safetyMatch
                && materialMatchesStockFilter(material, stockFilter);
        });

        return sortMaterials(filtered, sortMode);
    }, [compartmentMaterials, materialSearch, safetyFilter, sortMode, stockFilter]);

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

    const handleSaveProjectIdea = (idea: ProjectIdeaInput) => {
        if (editingIdea) {
            onEditProjectIdea(editingIdea.id, idea);
            setEditingIdea(null);
        } else {
            onAddProjectIdea(idea);
        }
    };

    return (
        <div style={styles.shell}>
            <div style={styles.header}>
                <div>
                    <p style={styles.eyebrow}>{t('admin.eyebrow')}</p>
                    <h2 style={styles.title}>{t('admin.title')}</h2>
                </div>

                <div style={styles.stats} aria-label="Admin inventory summary">
                    <div style={styles.stat}>
                        <Package size={17} />
                        {t('admin.materialsCount', { count: materials.length })}
                    </div>
                    <div style={styles.stat}>
                        <Inbox size={17} />
                        {t('admin.pendingCount', { count: pendingRequests.length })}
                    </div>
                    <div style={styles.stat}>
                        <AlertTriangle size={17} />
                        {t('admin.outOfStockCount', { count: emptyMaterials.length })}
                    </div>
                </div>
            </div>

            <ResizablePanelGroup orientation="horizontal" style={styles.panelGroup}>
                <ResizablePanel defaultSize={66} minSize={45}>
                    <div style={styles.workspace}>
                        <aside style={styles.areaRail} aria-label="Storage areas">
                            <p style={styles.sectionLabel}>
                                <Package size={15} />
                                {t('admin.areas')}
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
                                            <div style={{ fontSize: 14, fontWeight: 700 }}>
                                                {compartment.number}
                                            </div>
                                            <div style={{ marginTop: 2, fontSize: 13, color: 'var(--viventory-muted-text)' }}>
                                                {compartment.name}
                                            </div>
                                            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--viventory-muted-text)' }}>
                                                {t('admin.areaMaterials', { count: areaMaterials.length })}
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
                                            : t('admin.selectArea')}
                                    </h3>
                                    <p style={styles.paneMeta}>
                                        {selectedCompartment
                                            ? t('admin.shownOf', { shown: filteredCompartmentMaterials.length, total: compartmentMaterials.length })
                                            : t('admin.chooseArea')}
                                    </p>
                                </div>

                                {selectedCompartment && (
                                    <button
                                        type="button"
                                        onClick={openAddMaterial}
                                        style={makeButtonStyle('primary')}
                                    >
                                        <Plus size={17} />
                                        {t('admin.addMaterial')}
                                    </button>
                                )}
                            </div>

                            <div style={styles.controls} aria-label="Admin material controls">
                                <label style={styles.controlField}>
                                    <span style={styles.controlLabel}>{t('admin.search')}</span>
                                    <span style={styles.controlInputWrap}>
                                        <Search
                                            size={16}
                                            style={{
                                                position: 'absolute',
                                                left: 10,
                                                top: 11,
                                                color: 'var(--viventory-muted-text)',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                        <input
                                            value={materialSearch}
                                            onChange={event => setMaterialSearch(event.target.value)}
                                            placeholder={t('admin.searchPlaceholder')}
                                            style={styles.searchInput}
                                        />
                                    </span>
                                </label>

                                <label style={styles.controlField}>
                                    <span style={styles.controlLabel}>{t('admin.location')}</span>
                                    <select
                                        value={selectedElement ?? ''}
                                        onChange={event => setSelectedElement(event.target.value || null)}
                                        style={styles.controlInput}
                                    >
                                        {compartments.map(compartment => (
                                            <option key={compartment.id} value={compartment.id}>
                                                {compartment.number} {compartment.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label style={styles.controlField}>
                                    <span style={styles.controlLabel}>{t('admin.sort')}</span>
                                    <select
                                        value={sortMode}
                                        onChange={event => setSortMode(event.target.value as MaterialSortMode)}
                                        style={styles.controlInput}
                                    >
                                        <option value="name-asc">{t('admin.sortNameAsc')}</option>
                                        <option value="name-desc">{t('admin.sortNameDesc')}</option>
                                        <option value="quantity-desc">{t('admin.sortQtyDesc')}</option>
                                        <option value="quantity-asc">{t('admin.sortQtyAsc')}</option>
                                    </select>
                                </label>

                                <label style={styles.controlField}>
                                    <span style={styles.controlLabel}>{t('admin.stock')}</span>
                                    <select
                                        value={stockFilter}
                                        onChange={event => setStockFilter(event.target.value as StockFilterMode)}
                                        style={styles.controlInput}
                                    >
                                        <option value="all">{t('admin.stockAll')}</option>
                                        <option value="in-stock">{t('admin.stockIn')}</option>
                                        <option value="low-stock">{t('admin.stockLow')}</option>
                                        <option value="out-of-stock">{t('admin.stockOut')}</option>
                                    </select>
                                </label>

                                <label style={styles.controlField}>
                                    <span style={styles.controlLabel}>{t('admin.safety')}</span>
                                    <select
                                        value={safetyFilter}
                                        onChange={event => setSafetyFilter(event.target.value as SafetyFilterMode)}
                                        style={styles.controlInput}
                                    >
                                        <option value="all">{t('admin.safetyAll')}</option>
                                        <option value="adult">{t('admin.safetyAdult')}</option>
                                        <option value="standard">{t('admin.safetyStandard')}</option>
                                    </select>
                                </label>
                            </div>

                            <div style={styles.list}>
                                {!selectedCompartment ? (
                                    <div style={styles.emptyState}>
                                        <Package size={24} />
                                        <p style={{ margin: '10px 0 0', fontWeight: 700 }}>{t('admin.noAreaSelected')}</p>
                                    </div>
                                ) : compartmentMaterials.length === 0 ? (
                                    <div style={styles.emptyState}>
                                        <Package size={24} />
                                        <p style={{ margin: '10px 0 0', fontWeight: 700 }}>{t('admin.noMaterialsHere')}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 13 }}>{t('admin.addFirst')}</p>
                                    </div>
                                ) : filteredCompartmentMaterials.length === 0 ? (
                                    <div style={styles.emptyState}>
                                        <Search size={24} />
                                        <p style={{ margin: '10px 0 0', fontWeight: 700 }}>{t('admin.noMatching')}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 13 }}>{t('admin.changeFilters')}</p>
                                    </div>
                                ) : (
                                    filteredCompartmentMaterials.map(material => (
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

                                            <div style={makeStockPillStyle(material)}>
                                                {translatedStockLabel(language, material)}
                                            </div>

                                            <div style={styles.cardFooter}>
                                                <span style={styles.subtlePill}>
                                                    <MapPin size={13} />
                                                    {material.location ?? selectedCompartment.number}
                                                </span>
                                                {material.category && (
                                                    <span style={styles.subtlePill}>
                                                        {material.category}
                                                    </span>
                                                )}
                                                {material.storage && (
                                                    <span style={styles.subtlePill}>
                                                        <Package size={13} />
                                                        {material.storage}
                                                    </span>
                                                )}
                                                {materialNeedsAdultSupervision(material) && (
                                                    <span style={styles.subtlePill}>
                                                        <AlertTriangle size={13} />
                                                        {t('admin.adultSupervision')}
                                                    </span>
                                                )}
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
                                {t('admin.reviewQueue')}
                            </p>
                            <p style={styles.paneMeta}>
                                {t('admin.reviewSub')}
                            </p>
                        </section>

                        <div style={styles.sideScroll}>
                            {pendingRequests.length === 0 ? (
                                <div style={styles.emptyState}>
                                    <Inbox size={24} />
                                    <p style={{ margin: '10px 0 0', fontWeight: 700 }}>{t('admin.noPending')}</p>
                                </div>
                            ) : (
                                pendingRequests.map(request => (
                                    <article key={request.id} style={styles.requestCard}>
                                        <div style={styles.requestTop}>
                                            <div>
                                                <h4 style={styles.requestName}>{request.materialName}</h4>
                                                <p style={styles.requestMeta}>
                                                    {t('admin.qty', { count: request.requestedQuantity })}
                                                </p>
                                            </div>
                                            <span style={makeButtonStyle('ghost')}>{t('admin.pendingBadge')}</span>
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
                                                {t('admin.approve')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeclineRequest(request.id)}
                                                style={makeButtonStyle('decline')}
                                            >
                                                <XCircle size={16} />
                                                {t('admin.decline')}
                                            </button>
                                        </div>

                                        <p style={{ ...styles.requestMeta, marginBottom: 0 }}>
                                            {new Date(request.createdAt).toLocaleString()}
                                        </p>
                                    </article>
                                ))
                            )}
                        </div>

                        <section style={{ ...styles.sideSection, borderTop: '1px solid var(--viventory-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                <div>
                                    <p style={styles.sectionLabel}>
                                        <Lightbulb size={15} />
                                        {t('admin.projectIdeas')}
                                    </p>
                                    <p style={styles.paneMeta}>
                                        {t('admin.projectIdeasSub')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingIdea(null);
                                        setIsIdeaDialogOpen(true);
                                    }}
                                    style={makeButtonStyle('primary')}
                                >
                                    <Plus size={16} />
                                    {t('admin.addIdea')}
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, maxHeight: 220, overflow: 'auto' }}>
                                {projectIdeas.length === 0 ? (
                                    <p style={styles.paneMeta}>{t('admin.noIdeas')}</p>
                                ) : (
                                    projectIdeas.map(idea => (
                                        <article key={idea.id} style={styles.requestCard}>
                                            <div style={styles.requestTop}>
                                                <div style={{ minWidth: 0 }}>
                                                    <h4 style={styles.requestName}>{idea.name}</h4>
                                                    <p style={styles.requestMeta}>
                                                        {translateDifficulty(language, idea.difficulty)} · {t('admin.ideaItems', { count: idea.requiredItemIds.length })}
                                                    </p>
                                                </div>
                                                <div style={styles.cardActions}>
                                                    <button
                                                        type="button"
                                                        aria-label={`Edit ${idea.name}`}
                                                        title={`Edit ${idea.name}`}
                                                        onClick={() => {
                                                            setEditingIdea(idea);
                                                            setIsIdeaDialogOpen(true);
                                                        }}
                                                        style={makeButtonStyle('ghost')}
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label={`Delete ${idea.name}`}
                                                        title={`Delete ${idea.name}`}
                                                        onClick={() => {
                                                            if (confirm('Delete this project idea?')) onDeleteProjectIdea(idea.id);
                                                        }}
                                                        style={makeButtonStyle('ghost')}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        </section>

                        {emptyMaterials.length > 0 && (
                            <section style={styles.sideSection}>
                                <p style={styles.sectionLabel}>
                                    <AlertTriangle size={15} />
                                    {t('admin.outOfStockSection')}
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {emptyMaterials.map(material => (
                                        <span key={material.id} style={makeStockPillStyle(material)}>
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

            <ProjectIdeaDialog
                isOpen={isIdeaDialogOpen}
                onClose={() => { setIsIdeaDialogOpen(false); setEditingIdea(null); }}
                onSave={handleSaveProjectIdea}
                idea={editingIdea}
                items={makerItems}
            />
        </div>
    );
}
