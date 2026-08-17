import { useEffect, useState } from 'react';
import { filterMaterialsBySearch, findSubstitutes } from '../utils/materialSearch';
import {
    ALL_CATEGORIES,
    collectMaterialCategories,
    filterMaterialsByCategory,
} from '../utils/materialCategories';
import { isMaterialAvailable, kioskDescription } from '../utils/materialDetails';
import { zoneToken } from '../utils/zoneIdentity';
import { materialRequiresAdultSupervision } from './inventoryStore';
import { CategoryGlyph } from './CategoryGlyph';
import { sortMaterials, MATERIAL_SORT_KEYS, MaterialSortKey } from '../utils/materialSort';
import { translatedStockLabel, useI18n, TranslationKey } from '../i18n/i18n';
import {
    Search,
    Send,
    Check,
    Package,
    Clock3,
} from 'lucide-react';
import { Material, FloorData, MaterialRequest } from '../types';
import { RoomMap } from './RoomMap';
import { UserPrefs } from './SettingsView';

type UserTab = 'map' | 'materials';

const SORT_LABEL_KEYS: Record<MaterialSortKey, TranslationKey> = {
    'default': 'user.sortDefault',
    'name-asc': 'user.sortNameAsc',
    'name-desc': 'user.sortNameDesc',
    'location': 'user.sortLocation',
    'adult-first': 'user.sortAdult',
    'stock': 'user.sortStock',
};

interface UserViewProps {
    floors: FloorData[];
    materials: Material[];
    requests: MaterialRequest[];
    onSubmitRequest: (materialId: string, quantity: number, reason: string) => Promise<void> | void;
    prefs?: UserPrefs;
    initialTab?: UserTab;
    initialMaterialSearch?: string;
    /**
     * Kiosk mode drives map/materials from its own bottom bar, so the internal
     * tab strip is suppressed there to avoid two competing navigations.
     */
    showTabBar?: boolean;
    /**
     * Renders the child-facing card: category glyph, zone dot, safety badge,
     * substitutes when empty, and a description stripped of staff bookkeeping.
     * Off by default so the staff tab keeps its full detail.
     */
    kioskMode?: boolean;
}

type Styles = {
    container: React.CSSProperties;
    tabBar: React.CSSProperties;
    tabBtn: (active: boolean) => React.CSSProperties;
    mapWrapper: React.CSSProperties;
    absoluteFill: React.CSSProperties;
    hint: React.CSSProperties;
    materialsPanel: React.CSSProperties;
    materialsHero: React.CSSProperties;
    searchBar: React.CSSProperties;
    input: React.CSSProperties;
    sortField: React.CSSProperties;
    sortLabel: React.CSSProperties;
    sortSelect: React.CSSProperties;
    grid: React.CSSProperties;
    emptyState: React.CSSProperties;
    card: (empty: boolean) => React.CSSProperties;
    statusPill: (empty: boolean) => React.CSSProperties;
    chipRow: React.CSSProperties;
    zoneDot: (token: string) => React.CSSProperties;
    safetyBadge: React.CSSProperties;
    substitutePanel: React.CSSProperties;
    substituteLead: React.CSSProperties;
    substituteChip: React.CSSProperties;
    chip: React.CSSProperties;
    cardDescription: React.CSSProperties;
    btnPrimary: React.CSSProperties;
    pendingPanel: React.CSSProperties;
    modalBackdrop: React.CSSProperties;
    modal: React.CSSProperties;
    buttonRow: React.CSSProperties;
    primaryBtn: React.CSSProperties;
    secondaryBtn: React.CSSProperties;
};

const styles: Styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: 'var(--viventory-bg)',
        color: 'var(--viventory-text)'
    },

    tabBar: {
        background: 'var(--viventory-surface)',
        borderBottom: '1px solid var(--viventory-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        gap: '8px',
        overflowX: 'auto'
    },

    tabBtn: (active: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        fontSize: 13,
        fontWeight: 750,
        border: active ? '2px solid var(--viventory-tab-active-border)' : '1px solid var(--viventory-border)',
        borderRadius: 999,
        color: active ? 'var(--viventory-text)' : 'var(--viventory-muted-text)',
        background: active ? 'var(--viventory-active-tab)' : 'var(--viventory-surface)',
        whiteSpace: 'nowrap',
        cursor: 'pointer'
    }),

    mapWrapper: { flex: 1, position: 'relative', overflow: 'hidden' },

    absoluteFill: { position: 'absolute', inset: 0 },

    hint: {
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--viventory-welcome-card)',
        padding: '8px 14px',
        borderRadius: 999,
        border: '1px solid var(--viventory-border)',
        fontSize: 12,
        color: 'var(--viventory-muted-text)',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)'
    },

    materialsPanel: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 20,
        background: 'var(--viventory-bg)'
    },

    materialsHero: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 18,
        padding: 22,
        marginBottom: 16,
        borderRadius: 8,
        border: '1px solid var(--viventory-border)',
        background: 'var(--viventory-welcome-card)',
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)',
        backdropFilter: 'blur(14px)'
    },

    searchBar: {
        padding: 0,
        marginBottom: 16,
        background: 'transparent',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center'
    },

    sortField: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
    },

    sortLabel: {
        fontSize: 13,
        fontWeight: 750,
        color: 'var(--viventory-muted-text)',
        whiteSpace: 'nowrap'
    },

    sortSelect: {
        padding: '13px 14px',
        borderRadius: 999,
        border: '1px solid var(--viventory-border)',
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        fontSize: 15,
        fontWeight: 650,
        outline: 'none',
        cursor: 'pointer',
        boxShadow: '0 10px 26px rgba(15, 23, 42, 0.08)',
        // A native select sizes itself to its widest option. The longest category
        // ("Peripheral Devices (Power. Cables. Adapters. Mouses)") would otherwise
        // push the control past a third of the row and squeeze the search box,
        // which is the control children actually reach for.
        maxWidth: 220,
        textOverflow: 'ellipsis'
    },

    input: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '15px 16px 15px 44px',
        borderRadius: 999,
        border: '1px solid var(--viventory-border)',
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        fontSize: 16,
        fontWeight: 650,
        outline: 'none',
        boxShadow: '0 10px 26px rgba(15, 23, 42, 0.08)'
    },

    grid: {
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
    },
    emptyState: {
        padding: 24,
        border: '1px dashed var(--viventory-border)',
        borderRadius: 8,
        color: 'var(--viventory-muted-text)',
        background: 'var(--viventory-welcome-card)',
        fontSize: 15,
        // A long unbroken query must wrap instead of spilling past the container.
        overflowWrap: 'anywhere',
        wordBreak: 'break-word'
    },

    card: (empty: boolean) => ({
        background: 'var(--viventory-surface)',
        border: `1px solid ${empty ? 'rgba(239, 111, 77, 0.48)' : 'var(--viventory-border)'}`,
        borderRadius: 8,
        padding: 14,
        opacity: empty ? 0.82 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)'
    }),

    statusPill: (empty: boolean) => ({
        flexShrink: 0,
        alignSelf: 'flex-start',
        whiteSpace: 'nowrap',
        borderRadius: 999,
        padding: '5px 10px',
        background: empty ? 'rgba(161, 130, 79, 0.16)' : 'rgba(165, 214, 209, 0.26)',
        color: empty ? 'var(--viventory-welcome-accent-2)' : 'var(--viventory-welcome-accent)',
        border: empty ? '1px solid rgba(161, 130, 79, 0.34)' : '1px solid rgba(51, 167, 181, 0.28)',
        fontSize: 12,
        fontWeight: 800
    }),

    chipRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6
    },

    zoneDot: (token: string): React.CSSProperties => ({
        display: 'inline-block',
        width: 9,
        height: 9,
        borderRadius: '50%',
        marginRight: 7,
        verticalAlign: 'middle',
        background: token,
        flexShrink: 0,
    }),

    safetyBadge: {
        alignSelf: 'flex-start',
        padding: '4px 9px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 750,
        color: 'var(--vk-caution, var(--viventory-text))',
        background: 'color-mix(in srgb, var(--vk-caution, #A1824F) 16%, transparent)',
        border: '1px solid var(--vk-caution, var(--viventory-border))',
    },

    substitutePanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 10px',
        borderRadius: 12,
        background: 'var(--vk-surface-raised, transparent)',
        border: '1px solid var(--vk-accent-soft, var(--viventory-border))',
    },

    substituteLead: {
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--vk-ink-muted, var(--viventory-muted-text))',
    },

    substituteChip: {
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid var(--vk-accent, var(--viventory-border))',
        background: 'var(--vk-surface, transparent)',
        color: 'var(--vk-ink, var(--viventory-text))',
        fontSize: 13,
        fontWeight: 650,
        cursor: 'pointer',
    },

    chip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        maxWidth: '100%',
        borderRadius: 999,
        border: '1px solid var(--viventory-border)',
        background: 'var(--viventory-muted-surface)',
        color: 'var(--viventory-muted-text)',
        padding: '3px 8px',
        fontSize: 11.5,
        fontWeight: 700,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },

    cardDescription: {
        margin: 0,
        color: 'var(--viventory-muted-text)',
        fontSize: 13,
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    },

    btnPrimary: {
        background: 'linear-gradient(135deg, var(--viventory-welcome-accent), var(--viventory-welcome-accent-2))',
        border: 'none',
        color: '#1f1300',
        padding: '10px 12px',
        borderRadius: 999,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
    },

    pendingPanel: {
        marginTop: 20,
        padding: 14,
        borderRadius: 8,
        background: 'rgba(165, 214, 209, 0.3)',
        border: '1px solid rgba(51, 167, 181, 0.32)',
        color: 'var(--viventory-text)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontWeight: 800
    },

    modalBackdrop: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.52)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        zIndex: 50
    },

    modal: {
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        borderRadius: 8,
        border: '1px solid var(--viventory-border)',
        padding: 22,
        width: '100%',
        maxWidth: 420,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
    },

    buttonRow: {
        display: 'flex',
        gap: 8
    },

    primaryBtn: {
        flex: 1,
        background: 'var(--viventory-welcome-accent)',
        color: '#1f1300',
        border: 'none',
        padding: '10px',
        borderRadius: 999,
        cursor: 'pointer',
        fontWeight: 800
    },

    secondaryBtn: {
        flex: 1,
        background: 'var(--viventory-muted-surface)',
        color: 'var(--viventory-text)',
        border: '1px solid var(--viventory-border)',
        padding: '10px',
        borderRadius: 999,
        cursor: 'pointer'
    }
};

export function UserView({
                             floors,
                             materials,
                             requests,
                             onSubmitRequest,
                             prefs,
                             initialTab = 'map',
                             initialMaterialSearch = '',
                             showTabBar = true,
                             kioskMode = false
                         }: UserViewProps) {
    const [activeTab, setActiveTab] = useState<UserTab>(initialTab);
    const [search, setSearch] = useState(initialMaterialSearch);
    const [requesting, setRequesting] = useState<Material | null>(null);
    const [reqQty, setReqQty] = useState('1');
    const [reqReason, setReqReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [requestError, setRequestError] = useState('');
    const [selectedCompartment, setSelectedCompartment] = useState<string | null>(null);
    const [sort, setSort] = useState<MaterialSortKey>('default');
    const [category, setCategory] = useState<string>(ALL_CATEGORIES);
    const { language, t } = useI18n();

    // Options come from the full inventory, not the filtered set, so choosing a
    // category never removes the other categories from the picker.
    const categoryOptions = collectMaterialCategories(materials);
    const searchedMaterials = filterMaterialsBySearch(materials, search);
    const filteredMaterials = filterMaterialsByCategory(searchedMaterials, category);
    const displayedMaterials = sortMaterials(filteredMaterials, sort);
    const hasMaterialSearch = search.trim().length > 0;

    // When an outer shell owns navigation (kiosk mode), following initialTab lets
    // it switch panes without remounting and losing the search and filter state.
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        const handleMaterialSearch = (event: Event) => {
            const detail = (event as CustomEvent<{ query?: string }>).detail;

            setActiveTab('materials');
            setSearch(detail?.query ?? '');
        };

        window.addEventListener('viventory:material-search', handleMaterialSearch);

        return () => {
            window.removeEventListener('viventory:material-search', handleMaterialSearch);
        };
    }, []);

    const handleRequest = async () => {
        if (!requesting) return;

        const quantity = Number(reqQty);
        if (!Number.isInteger(quantity) || quantity <= 0) {
            setRequestError(t('user.errQty'));
            return;
        }

        // A zero count with an "in stock" status means the exact amount is
        // unknown, so only enforce the limit when a real count exists.
        if (requesting.quantity > 0 && quantity > requesting.quantity) {
            setRequestError(t('user.errMax', { count: requesting.quantity, unit: requesting.unit }));
            return;
        }

        try {
            setSubmitting(true);
            setRequestError('');
            await onSubmitRequest(requesting.id, quantity, reqReason.trim());
            setSubmitted(true);
            window.setTimeout(() => {
                setRequesting(null);
                setSubmitted(false);
                setReqQty('1');
                setReqReason('');
                setRequestError('');
            }, 800);
        } catch (error) {
            setRequestError(error instanceof Error ? error.message : t('user.errFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const closeRequestModal = () => {
        if (submitting) return;

        setRequesting(null);
        setSubmitted(false);
        setReqQty('1');
        setReqReason('');
        setRequestError('');
    };

    const startRequest = (material: Material) => {
        setRequesting(material);
        setSubmitted(false);
        setReqQty('1');
        setReqReason('');
        setRequestError('');
    };

    const myRequests = requests.filter(r => r.status === 'pending');

    return (
        <div style={styles.container}>
            {showTabBar && (
                <div style={styles.tabBar}>
                    {(['map', 'materials'] as UserTab[]).map(tab => (
                        <button
                            key={tab}
                            style={styles.tabBtn(activeTab === tab)}
                            onClick={() => setActiveTab(tab)}
                        >
                            {t(tab === 'map' ? 'user.map' : 'user.materials')}
                        </button>
                    ))}
                </div>
            )}

            {activeTab === 'map' && (
                <div style={styles.mapWrapper}>
                    <div style={styles.absoluteFill}>
                        <RoomMap
                            floors={floors}
                            materials={materials}
                            selectedCompartment={selectedCompartment}
                            onCompartmentClick={setSelectedCompartment}
                        />
                    </div>

                    {!selectedCompartment && (
                        <div style={styles.hint}>
                            {t('user.hint')}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'materials' && (
                <div style={styles.materialsPanel}>
                    <div style={styles.materialsHero}>
                        <div style={{ textAlign: 'left' }}>
                            <p
                                style={{
                                    margin: '0 0 8px',
                                    color: 'var(--viventory-welcome-accent)',
                                    fontSize: 13,
                                    fontWeight: 850,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0
                                }}
                            >
                                {t('user.eyebrow')}
                            </p>
                            <h2
                                style={{
                                    margin: 0,
                                    color: 'var(--viventory-text)',
                                    fontSize: 32,
                                    fontWeight: 850,
                                    letterSpacing: 0
                                }}
                            >
                                {t('user.title')}
                            </h2>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '12px 16px',
                                borderRadius: 999,
                                background: 'var(--viventory-welcome-accent)',
                                color: '#1f1300',
                                fontWeight: 850
                            }}
                        >
                            <Package size={18} />
                            {t('user.shown', { count: displayedMaterials.length })}
                        </div>
                    </div>

                    <div style={styles.searchBar}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                            <Search
                                style={{
                                    position: 'absolute',
                                    left: 16,
                                    top: 15,
                                    color: 'var(--viventory-muted-text)'
                                }}
                            />
                            <input
                                style={styles.input}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('user.searchPlaceholder')}
                            />
                        </div>
                        <label style={styles.sortField}>
                            <span style={styles.sortLabel}>{t('user.categoryLabel')}</span>
                            <select
                                style={styles.sortSelect}
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                aria-label={t('user.categoryLabel')}
                            >
                                <option value={ALL_CATEGORIES}>{t('user.categoryAll')}</option>
                                {categoryOptions.map(option => (
                                    <option key={option.name} value={option.name}>
                                        {option.name} ({option.count})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label style={styles.sortField}>
                            <span style={styles.sortLabel}>{t('user.sortLabel')}</span>
                            <select
                                style={styles.sortSelect}
                                value={sort}
                                onChange={e => setSort(e.target.value as MaterialSortKey)}
                                aria-label={t('user.sortLabel')}
                            >
                                {MATERIAL_SORT_KEYS.map(key => (
                                    <option key={key} value={key}>
                                        {t(SORT_LABEL_KEYS[key])}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {displayedMaterials.length > 0 ? (
                        <div style={styles.grid}>
                            {displayedMaterials.map(m => {
                                const available = isMaterialAvailable(m);
                                const shownDescription = kioskMode
                                    ? kioskDescription(m.description)
                                    : m.description;
                                // Staff still need location and storage; a child
                                // only needs to know which category it is.
                                const chips = (kioskMode
                                    ? [m.category]
                                    : [
                                        m.category,
                                        m.location && `📍 ${m.location}`,
                                        m.storage && `📦 ${m.storage}`,
                                    ]
                                ).filter(Boolean) as string[];
                                const substitutes = kioskMode && !available
                                    ? findSubstitutes(m, materials)
                                    : [];
                                const zone = kioskMode ? zoneToken(m.compartmentId, floors) : null;
                                // Not m.safetyLevel: that stored flag is unset on most
                                // real inventory, and safety is inferred from the name
                                // instead. Reading the raw field meant the badge never
                                // fired for a laser cutter.
                                const needsAdult = kioskMode && materialRequiresAdultSupervision(m);

                                return (
                                    <div key={m.id} style={styles.card(!available)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0 }}>
                                                {kioskMode && <CategoryGlyph category={m.category ?? ''} />}
                                                <strong style={{ fontSize: 16, textAlign: 'left', lineHeight: 1.25 }}>
                                                    {zone && <span style={styles.zoneDot(zone)} aria-hidden="true" />}
                                                    {m.name}
                                                </strong>
                                            </div>
                                            <span style={styles.statusPill(!available)}>
                                                {translatedStockLabel(language, m)}
                                            </span>
                                        </div>

                                        {needsAdult && (
                                            <span style={styles.safetyBadge}>
                                                {t('user.needsAdult')}
                                            </span>
                                        )}

                                        {chips.length > 0 && (
                                            <div style={styles.chipRow}>
                                                {chips.map(chip => (
                                                    <span key={chip} style={styles.chip} title={chip}>
                                                        {chip}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {shownDescription && (
                                            <p style={styles.cardDescription} title={shownDescription}>
                                                {shownDescription}
                                            </p>
                                        )}

                                        {substitutes.length > 0 && (
                                            <div style={styles.substitutePanel}>
                                                <span style={styles.substituteLead}>
                                                    {t('user.tryInstead')}
                                                </span>
                                                <div style={styles.chipRow}>
                                                    {substitutes.map(s => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            style={styles.substituteChip}
                                                            onClick={() => setSearch(s.name)}
                                                        >
                                                            {s.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            style={{ ...styles.btnPrimary, marginTop: 'auto' }}
                                            onClick={() => startRequest(m)}
                                            disabled={!available}
                                        >
                                            <Send size={14} /> {t('user.request')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={styles.emptyState}>
                            {hasMaterialSearch
                                ? t('user.noResults', { query: search.trim() })
                                : category !== ALL_CATEGORIES
                                    ? t('user.noResults', { query: category })
                                    : t('user.noMaterials')}
                        </div>
                    )}

                    {myRequests.length > 0 && (
                        <div style={styles.pendingPanel}>
                            <Clock3 size={18} />
                            {t('user.pending', { count: myRequests.length })}
                        </div>
                    )}
                </div>
            )}

            {requesting && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modal}>
                        {submitted ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Check />
                                {t('user.requestSubmitted')}
                            </div>
                        ) : (
                            <>
                                <h3 style={{ margin: 0, fontSize: 24, letterSpacing: 0 }}>
                                    {t('user.requestTitle', { name: requesting.name })}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--viventory-muted-text)' }}>
                                    {t('user.requestSub')}
                                </p>

                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    max={requesting.quantity > 0 ? requesting.quantity : undefined}
                                    value={reqQty}
                                    onChange={e => setReqQty(e.target.value)}
                                    style={styles.input}
                                />

                                <textarea
                                    value={reqReason}
                                    onChange={e => setReqReason(e.target.value)}
                                    placeholder={t('user.reasonPlaceholder')}
                                    style={{
                                        ...styles.input,
                                        minHeight: 96,
                                        borderRadius: 8,
                                        padding: 12,
                                        resize: 'vertical'
                                    }}
                                />

                                {requestError && (
                                    <p style={{ margin: 0, color: 'var(--viventory-welcome-accent-2)', fontWeight: 750 }}>
                                        {requestError}
                                    </p>
                                )}

                                <div style={styles.buttonRow}>
                                    <button style={styles.primaryBtn} onClick={handleRequest} disabled={submitting}>
                                        {submitting ? t('user.submitting') : t('user.submit')}
                                    </button>
                                    <button style={styles.secondaryBtn} onClick={closeRequestModal} disabled={submitting}>
                                        {t('user.cancel')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
