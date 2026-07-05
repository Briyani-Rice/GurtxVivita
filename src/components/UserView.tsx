import { useState } from 'react';
import {
    Search,
    Send,
    Check
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
}

type Styles = {
    container: React.CSSProperties;
    tabBar: React.CSSProperties;
    tabBtn: (active: boolean) => React.CSSProperties;
    mapWrapper: React.CSSProperties;
    absoluteFill: React.CSSProperties;
    hint: React.CSSProperties;
    searchBar: React.CSSProperties;
    input: React.CSSProperties;
    grid: React.CSSProperties;
    card: (empty: boolean) => React.CSSProperties;
    btnPrimary: React.CSSProperties;
    modalBackdrop: React.CSSProperties;
    modal: React.CSSProperties;
    buttonRow: React.CSSProperties;
    primaryBtn: React.CSSProperties;
    secondaryBtn: React.CSSProperties;
};

const styles: Styles = {
    container: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },

    tabBar: {
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        gap: '4px',
        overflowX: 'auto'
    },

    tabBtn: (active: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 14px',
        fontSize: 12,
        fontWeight: 500,
        borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
        color: active ? '#1d4ed8' : '#6b7280',
        background: 'transparent',
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
        background: 'rgba(255,255,255,0.9)',
        padding: '6px 12px',
        borderRadius: 999,
        border: '1px solid #e5e7eb',
        fontSize: 12,
        color: '#6b7280'
    },

    searchBar: {
        padding: 12,
        borderBottom: '1px solid #eee',
        background: '#fff'
    },

    input: {
        width: '100%',
        padding: '10px 12px 10px 36px',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        background: '#f9fafb',
        fontSize: 14
    },

    grid: {
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'
    },

    card: (empty: boolean) => ({
        background: '#fff',
        border: `1px solid ${empty ? '#fecaca' : '#e5e7eb'}`,
        borderRadius: 16,
        padding: 14,
        opacity: empty ? 0.75 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    }),

    btnPrimary: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1d4ed8',
        padding: '6px 10px',
        borderRadius: 10,
        cursor: 'pointer',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6
    },

    modalBackdrop: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        zIndex: 50
    },

    modal: {
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
    },

    buttonRow: {
        display: 'flex',
        gap: 8
    },

    primaryBtn: {
        flex: 1,
        background: '#2563eb',
        color: '#fff',
        border: 'none',
        padding: '10px',
        borderRadius: 12,
        cursor: 'pointer'
    },

    secondaryBtn: {
        flex: 1,
        background: '#f3f4f6',
        border: 'none',
        padding: '10px',
        borderRadius: 12,
        cursor: 'pointer'
    }
};

export function UserView({
                             floors,
                             materials,
                             requests,
                             onSubmitRequest
                         }: UserViewProps) {
    const [activeTab, setActiveTab] = useState<UserTab>('map');
    const [search, setSearch] = useState('');
    const [requesting, setRequesting] = useState<Material | null>(null);
    const [reqQty, setReqQty] = useState('1');
    const [reqReason, setReqReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [selectedCompartment, setSelectedCompartment] = useState<string | null>(null);

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
    );

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
                <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
                    <div style={styles.searchBar}>
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: 10, top: 10 }} />
                            <input
                                style={styles.input}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search materials..."
                            />
                        </div>
                    </div>

                    <div style={styles.grid}>
                        {filteredMaterials.map(m => {
                            const empty = m.quantity <= 0;

                            return (
                                <div key={m.id} style={styles.card(empty)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>{m.name}</strong>
                                        <span>{empty ? 'Out' : m.quantity}</span>
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

                    {myRequests.length > 0 && (
                        <div style={{ marginTop: 20, padding: 12, background: '#fef3c7' }}>
                            Pending: {myRequests.length}
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
                                <h3>Request material</h3>

                                <input
                                    type="number"
                                    value={reqQty}
                                    onChange={e => setReqQty(e.target.value)}
                                />

                                <textarea
                                    value={reqReason}
                                    onChange={e => setReqReason(e.target.value)}
                                    placeholder="Reason"
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