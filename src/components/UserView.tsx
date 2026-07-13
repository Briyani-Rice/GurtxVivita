import { useEffect, useState } from 'react';
import { filterMaterialsBySearch } from '../utils/materialSearch';
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

interface UserViewProps {
    floors: FloorData[];
    materials: Material[];
    requests: MaterialRequest[];
    onSubmitRequest: (materialId: string, quantity: number, reason: string) => void;
    prefs?: UserPrefs;
    initialTab?: UserTab;
    initialMaterialSearch?: string;
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
    grid: React.CSSProperties;
    emptyState: React.CSSProperties;
    card: (empty: boolean) => React.CSSProperties;
    statusPill: (empty: boolean) => React.CSSProperties;
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
        minHeight: 0,
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
        overflow: 'auto',
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
        background: 'transparent'
    },

    input: {
        width: '100%',
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
        gap: 14,
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))'
    },
    emptyState: {
        padding: 24,
        border: '1px dashed var(--viventory-border)',
        borderRadius: 8,
        color: 'var(--viventory-muted-text)',
        background: 'var(--viventory-welcome-card)',
        fontSize: 15
    },

    card: (empty: boolean) => ({
        background: 'var(--viventory-surface)',
        border: `1px solid ${empty ? 'rgba(239, 111, 77, 0.48)' : 'var(--viventory-border)'}`,
        borderRadius: 8,
        padding: 16,
        opacity: empty ? 0.82 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)'
    }),

    statusPill: (empty: boolean) => ({
        alignSelf: 'flex-start',
        borderRadius: 999,
        padding: '6px 10px',
        background: empty ? 'rgba(161, 130, 79, 0.16)' : 'rgba(165, 214, 209, 0.26)',
        color: empty ? 'var(--viventory-welcome-accent-2)' : 'var(--viventory-welcome-accent)',
        border: empty ? '1px solid rgba(161, 130, 79, 0.34)' : '1px solid rgba(51, 167, 181, 0.28)',
        fontSize: 12,
        fontWeight: 800
    }),

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
                             initialMaterialSearch = ''
                         }: UserViewProps) {
    const [activeTab, setActiveTab] = useState<UserTab>(initialTab);
    const [search, setSearch] = useState(initialMaterialSearch);
    const [requesting, setRequesting] = useState<Material | null>(null);
    const [reqQty, setReqQty] = useState('1');
    const [reqReason, setReqReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [selectedCompartment, setSelectedCompartment] = useState<string | null>(null);

    const filteredMaterials = filterMaterialsBySearch(materials, search);
    const hasMaterialSearch = search.trim().length > 0;

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

    const handleRequest = () => {
        if (!requesting) return;
        onSubmitRequest(requesting.id, Number(reqQty), reqReason);
        setSubmitted(true);
        setTimeout(() => {
            setRequesting(null);
            setSubmitted(false);
            setReqQty('1');
            setReqReason('');
        }, 800);
    };

    const myRequests = requests.filter(r => r.status === 'pending');

    return (
        <div style={styles.container}>
            <div style={styles.tabBar}>
                {(['map', 'materials'] as UserTab[]).map(tab => (
                    <button
                        key={tab}
                        style={styles.tabBtn(activeTab === tab)}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'map' && (
                <div style={styles.mapWrapper}>
                    <div style={styles.absoluteFill}>
                        <RoomMap
                            floors={floors}
                            materials={materials}
                            selectedCompartment={selectedCompartment}
                            onCompartmentClick={setSelectedCompartment}
                            isAdmin={false}
                        />
                    </div>

                    {!selectedCompartment && (
                        <div style={styles.hint}>
                            Tap a compartment to view materials
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
                                Materials studio
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
                                Find what you need to build
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
                            {filteredMaterials.length} shown
                        </div>
                    </div>

                    <div style={styles.searchBar}>
                        <div style={{ position: 'relative' }}>
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
                                placeholder="Search materials..."
                            />
                        </div>
                    </div>

                    {filteredMaterials.length > 0 ? (
                        <div style={styles.grid}>
                            {filteredMaterials.map(m => {
                                const empty = m.quantity <= 0;

                                return (
                                    <div key={m.id} style={styles.card(empty)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <div style={{ textAlign: 'left' }}>
                                                <strong style={{ fontSize: 18 }}>{m.name}</strong>
                                                <p style={{ margin: '6px 0 0', color: 'var(--viventory-muted-text)' }}>
                                                    {m.description}
                                                </p>
                                            </div>
                                            <span style={styles.statusPill(empty)}>
                                                {empty ? 'Out of stock' : 'Available now'}
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'baseline',
                                                gap: 6,
                                                color: 'var(--viventory-text)',
                                                fontWeight: 850
                                            }}
                                        >
                                            <span style={{ fontSize: 28 }}>{Math.max(m.quantity, 0)}</span>
                                            <span style={{ color: 'var(--viventory-muted-text)' }}>{m.unit}</span>
                                        </div>

                                        <button
                                            style={styles.btnPrimary}
                                            onClick={() => setRequesting(m)}
                                            disabled={empty}
                                        >
                                            <Send size={14} /> Request
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={styles.emptyState}>
                            {hasMaterialSearch
                                ? `No materials found for "${search.trim()}"`
                                : 'No materials available'}
                        </div>
                    )}

                    {myRequests.length > 0 && (
                        <div style={styles.pendingPanel}>
                            <Clock3 size={18} />
                            Pending requests: {myRequests.length}
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
                                Request submitted
                            </div>
                        ) : (
                            <>
                                <h3 style={{ margin: 0, fontSize: 24, letterSpacing: 0 }}>
                                    Request {requesting.name}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--viventory-muted-text)' }}>
                                    Need it for a project? Tell the team how many you need and why.
                                </p>

                                <input
                                    type="number"
                                    value={reqQty}
                                    onChange={e => setReqQty(e.target.value)}
                                    style={styles.input}
                                />

                                <textarea
                                    value={reqReason}
                                    onChange={e => setReqReason(e.target.value)}
                                    placeholder="Reason for request"
                                    style={{
                                        ...styles.input,
                                        minHeight: 96,
                                        borderRadius: 8,
                                        padding: 12,
                                        resize: 'vertical'
                                    }}
                                />

                                <div style={styles.buttonRow}>
                                    <button style={styles.primaryBtn} onClick={handleRequest}>
                                        Submit
                                    </button>
                                    <button style={styles.secondaryBtn} onClick={() => setRequesting(null)}>
                                        Cancel
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
