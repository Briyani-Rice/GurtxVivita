import { useState, useEffect } from 'react';
import {
    X, User as UserIcon, Lock, Eye, EyeOff, CheckCircle,
    XCircle, Clock, RotateCcw, Package, Palette, Info,
    ChevronRight, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { User, UserPerms, MaterialRequest } from '../types';

// ─── Pastel palette ────────────────────────────────────────────────────────────

const PASTEL = {
    blue:   'rgb(210,231,243)',
    pink:   'rgb(244,212,211)',
    yellow: 'rgb(249,244,206)',
    peach:  'rgb(249,223,188)',
    purple: 'rgb(226,205,236)',
};

// ─── Preference keys stored in localStorage ────────────────────────────────────

export interface UserPrefs {
    hideOutOfStock: boolean;
    compactCards:   boolean;
    defaultFloor:   number;   // index
}

const PREFS_KEY = 'user_prefs';

export function loadPrefs(): UserPrefs {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (raw) return { ...defaultPrefs(), ...JSON.parse(raw) };
    } catch {}
    return defaultPrefs();
}

function defaultPrefs(): UserPrefs {
    return { hideOutOfStock: false, compactCards: false, defaultFloor: 0 };
}

function savePrefs(p: UserPrefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SettingsViewProps {
    currentUser: User;
    requests:    MaterialRequest[];
    floorCount:  number;
    onClose:     () => void;
    onPrefsChange: (prefs: UserPrefs) => void;
}

type Tab = 'profile' | 'requests' | 'preferences' | 'about';
type ReqFilter = 'all' | 'pending' | 'approved' | 'declined' | 'returned';

// ─── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<MaterialRequest['status'], { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    pending:  { bg: 'rgb(249,223,188)', text: '#92400e', label: 'Pending',  icon: <Clock       size={12} /> },
    approved: { bg: 'rgb(210,231,243)', text: '#1e40af', label: 'Approved', icon: <CheckCircle  size={12} /> },
    declined: { bg: 'rgb(244,212,211)', text: '#9b1c1c', label: 'Declined', icon: <XCircle      size={12} /> },
    returned: { bg: 'rgb(226,205,236)', text: '#5b21b6', label: 'Returned', icon: <RotateCcw    size={12} /> },
};

// ─── Main component ─────────────────────────────────────────────────────────────

export function SettingsView({ currentUser, requests, floorCount, onClose, onPrefsChange }: SettingsViewProps) {
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const isAdmin = currentUser.getPerms() === UserPerms.Staff;

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'profile',     label: 'Profile',     icon: <UserIcon    size={15} /> },
        { id: 'requests',    label: 'My Requests',  icon: <Package     size={15} /> },
        { id: 'preferences', label: 'Preferences',  icon: <Palette     size={15} /> },
        { id: 'about',       label: 'About',        icon: <Info        size={15} /> },
    ];

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            {/* Panel */}
            <div
                className="relative w-full flex flex-col overflow-hidden"
                style={{
                    maxWidth: 640,
                    height: '80vh',
                    background: 'white',
                    borderRadius: 20,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
                    border: `1.5px solid ${PASTEL.blue}`,
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div
                    style={{
                        background: PASTEL.blue,
                        borderBottom: '1px solid rgb(180,210,230)',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: '#1e3a5f' }} className="vivitaFont">
                            Settings
                        </h2>
                        <p style={{ margin: 0, fontSize: 12, color: '#5a7a9a', marginTop: 2 }}>
                            Manage your profile and preferences
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'white',
                            border: '1px solid rgb(180,210,230)',
                            borderRadius: 10,
                            width: 34,
                            height: 34,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#5a7a9a',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                    {/* ── Sidebar tabs ── */}
                    <div
                        style={{
                            width: 160,
                            borderRight: '1px solid #e8f0f8',
                            padding: '12px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            flexShrink: 0,
                            background: '#fafbfd',
                        }}
                    >
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '9px 12px',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: activeTab === tab.id ? PASTEL.blue : 'transparent',
                                    color: activeTab === tab.id ? '#1e3a5f' : '#6b7280',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: activeTab === tab.id ? 600 : 400,
                                    textAlign: 'left',
                                    transition: 'background 0.15s',
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Content ── */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                        {activeTab === 'profile'     && <ProfileTab     user={currentUser} isAdmin={isAdmin} />}
                        {activeTab === 'requests'    && <RequestsTab    requests={requests} />}
                        {activeTab === 'preferences' && <PreferencesTab floorCount={floorCount} onChange={onPrefsChange} />}
                        {activeTab === 'about'       && <AboutTab />}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Profile
// ─────────────────────────────────────────────────────────────────────────────

function ProfileTab({ user, isAdmin }: { user: User; isAdmin: boolean }) {
    const [showCurrent,   setShowCurrent]   = useState(false);
    const [showNew,       setShowNew]       = useState(false);
    const [showConfirm,   setShowConfirm]   = useState(false);
    const [currentPw,     setCurrentPw]     = useState('');
    const [newPw,         setNewPw]         = useState('');
    const [confirmPw,     setConfirmPw]     = useState('');
    const [pwStatus,      setPwStatus]      = useState<'idle' | 'success' | 'error'>('idle');
    const [pwError,       setPwError]       = useState('');

    const handleChangePassword = () => {
        setPwStatus('idle');
        setPwError('');
        if (!currentPw)       { setPwError('Enter your current password.');    setPwStatus('error'); return; }
        if (newPw.length < 3) { setPwError('New password must be ≥ 3 characters.'); setPwStatus('error'); return; }
        if (newPw !== confirmPw) { setPwError('New passwords do not match.'); setPwStatus('error'); return; }
        if (!user.isPassword(currentPw)) { setPwError('Current password is incorrect.'); setPwStatus('error'); return; }

        user.setPassword(currentPw, newPw);
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
        setPwStatus('success');
        setTimeout(() => setPwStatus('idle'), 3000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Avatar + identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: isAdmin ? PASTEL.purple : PASTEL.blue,
                        border: `2px solid ${isAdmin ? 'rgb(180,155,210)' : 'rgb(170,205,230)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 26,
                    }}
                >
                    {isAdmin ? '🛡️' : '👤'}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#1e3a5f' }} className="vivitaFont">
                        {user.getUsername()}
                    </div>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 4,
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            background: isAdmin ? PASTEL.purple : PASTEL.blue,
                            color: isAdmin ? '#5b21b6' : '#1e40af',
                            border: `1px solid ${isAdmin ? 'rgb(180,155,210)' : 'rgb(170,205,230)'}`,
                        }}
                    >
                        {isAdmin ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                        {isAdmin ? 'Admin' : 'User'}
                    </div>
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e8f0f8' }} />

            {/* Change password */}
            <div>
                <h3 style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 14, color: '#374151' }} className="vivitaFont">
                    <Lock size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                    Change Password
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <PwField label="Current password" value={currentPw} show={showCurrent}
                             onChange={setCurrentPw} onToggle={() => setShowCurrent(p => !p)} />
                    <PwField label="New password"     value={newPw}     show={showNew}
                             onChange={setNewPw}     onToggle={() => setShowNew(p => !p)} />
                    <PwField label="Confirm new password" value={confirmPw} show={showConfirm}
                             onChange={setConfirmPw} onToggle={() => setShowConfirm(p => !p)} />
                </div>

                {pwStatus === 'error' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, color: '#9b1c1c', fontSize: 13 }}>
                        <AlertCircle size={14} /> {pwError}
                    </div>
                )}
                {pwStatus === 'success' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, color: '#1e40af', fontSize: 13 }}>
                        <CheckCircle size={14} /> Password updated successfully!
                    </div>
                )}

                <button
                    onClick={handleChangePassword}
                    style={{
                        marginTop: 14,
                        padding: '9px 20px',
                        background: PASTEL.blue,
                        border: '1.5px solid rgb(170,205,230)',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#1e3a5f',
                        cursor: 'pointer',
                    }}
                >
                    Update Password
                </button>
            </div>
        </div>
    );
}

function PwField({ label, value, show, onChange, onToggle }: {
    label: string; value: string; show: boolean;
    onChange: (v: string) => void; onToggle: () => void;
}) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px 38px 8px 12px',
                        border: '1.5px solid rgb(210,231,243)',
                        borderRadius: 10,
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: 'white',
                    }}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0,
                        display: 'flex', alignItems: 'center',
                    }}
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Requests
// ─────────────────────────────────────────────────────────────────────────────

function RequestsTab({ requests }: { requests: MaterialRequest[] }) {
    const [filter, setFilter] = useState<ReqFilter>('all');

    const filters: ReqFilter[] = ['all', 'pending', 'approved', 'declined', 'returned'];

    const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

    // Counts per status
    const counts: Record<ReqFilter, number> = {
        all:      requests.length,
        pending:  requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        declined: requests.filter(r => r.status === 'declined').length,
        returned: requests.filter(r => r.status === 'returned').length,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#374151' }} className="vivitaFont">
                <Package size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Request History
            </h3>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: 20,
                            border: '1.5px solid',
                            fontSize: 12,
                            fontWeight: filter === f ? 700 : 400,
                            cursor: 'pointer',
                            background: filter === f
                                ? (f === 'all' ? PASTEL.blue : STATUS_STYLE[f as Exclude<ReqFilter,'all'>]?.bg ?? PASTEL.blue)
                                : 'white',
                            borderColor: filter === f ? 'rgb(170,200,230)' : '#e5e7eb',
                            color: filter === f ? '#1e3a5f' : '#6b7280',
                        }}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {counts[f] > 0 && (
                            <span style={{ marginLeft: 5, fontWeight: 700 }}>({counts[f]})</span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 13 }}>
                    <Package size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                    No {filter === 'all' ? '' : filter} requests yet.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...filtered].reverse().map(req => {
                        const s = STATUS_STYLE[req.status];
                        return (
                            <div
                                key={req.id}
                                style={{
                                    background: 'white',
                                    border: '1px solid #e8f0f8',
                                    borderRadius: 12,
                                    padding: '12px 14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }} className="vivitaFont">
                    {req.materialName}
                  </span>
                                    <span
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                            background: s.bg, color: s.text,
                                        }}
                                    >
                    {s.icon} {s.label}
                  </span>
                                </div>
                                <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', gap: 16 }}>
                                    <span>Qty: <strong>{req.requestedQuantity}</strong></span>
                                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                </div>
                                {req.reason && (
                                    <div style={{ fontSize: 12, color: '#4b5563', background: '#f8fafc', borderRadius: 8, padding: '6px 10px' }}>
                                        "{req.reason}"
                                    </div>
                                )}
                                {req.comments && (
                                    <div style={{ fontSize: 12, color: '#374151', background: PASTEL.yellow, borderRadius: 8, padding: '6px 10px' }}>
                                        💬 Admin: {req.comments}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Preferences
// ─────────────────────────────────────────────────────────────────────────────

function PreferencesTab({ floorCount, onChange }: { floorCount: number; onChange: (p: UserPrefs) => void }) {
    const [prefs, setPrefs] = useState<UserPrefs>(loadPrefs);

    const update = (patch: Partial<UserPrefs>) => {
        const next = { ...prefs, ...patch };
        setPrefs(next);
        savePrefs(next);
        onChange(next);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#374151' }} className="vivitaFont">
                <Palette size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Display Preferences
            </h3>

            {/* Toggle rows */}
            {[
                {
                    key:   'hideOutOfStock' as const,
                    label: 'Hide out-of-stock items',
                    desc:  'Only show materials that are currently available',
                    color: PASTEL.pink,
                },
                {
                    key:   'compactCards' as const,
                    label: 'Compact material cards',
                    desc:  'Show smaller cards to fit more materials on screen',
                    color: PASTEL.peach,
                },
            ].map(row => (
                <PrefToggle
                    key={row.key}
                    label={row.label}
                    desc={row.desc}
                    accentColor={row.color}
                    value={prefs[row.key]}
                    onChange={v => update({ [row.key]: v })}
                />
            ))}

            <hr style={{ border: 'none', borderTop: '1px solid #e8f0f8' }} />

            {/* Default floor */}
            <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', marginBottom: 4 }}>
                    Default floor on open
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                    Which floor tab to show first when you open the material browser
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Array.from({ length: floorCount }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => update({ defaultFloor: i })}
                            style={{
                                padding: '6px 16px',
                                borderRadius: 10,
                                border: '1.5px solid',
                                fontSize: 13,
                                fontWeight: prefs.defaultFloor === i ? 700 : 400,
                                cursor: 'pointer',
                                background: prefs.defaultFloor === i ? PASTEL.blue : 'white',
                                borderColor: prefs.defaultFloor === i ? 'rgb(170,205,230)' : '#e5e7eb',
                                color: prefs.defaultFloor === i ? '#1e3a5f' : '#6b7280',
                            }}
                        >
                            Floor {i + 1}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{
                marginTop: 8,
                padding: '10px 14px',
                background: PASTEL.yellow,
                borderRadius: 10,
                fontSize: 12,
                color: '#78350f',
                border: '1px solid rgb(220,210,160)',
            }}>
                ✅ Preferences are saved automatically to your browser.
            </div>
        </div>
    );
}

function PrefToggle({ label, desc, accentColor, value, onChange }: {
    label: string; desc: string; accentColor: string; value: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '12px 14px',
                borderRadius: 12,
                background: value ? accentColor + '66' : '#f8fafc',
                border: `1px solid ${value ? accentColor : '#e8f0f8'}`,
                transition: 'background 0.2s',
            }}
        >
            <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{label}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{desc}</div>
            </div>
            {/* Toggle switch */}
            <button
                onClick={() => onChange(!value)}
                style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: 'none',
                    background: value ? 'rgb(130,185,225)' : '#d1d5db',
                    cursor: 'pointer',
                    position: 'relative',
                    flexShrink: 0,
                    transition: 'background 0.2s',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 3,
                        left: value ? 23 : 3,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'left 0.2s',
                    }}
                />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: About
// ─────────────────────────────────────────────────────────────────────────────

function AboutTab() {
    const rows = [
        { label: 'Application',   value: 'VIVITA Materials'     },
        { label: 'Version',       value: '1.0.0'                },
        { label: 'Built with',    value: 'React + Tailwind CSS' },
        { label: 'AI Assistant',  value: 'Hugging Face Inference API' },
        { label: 'Storage',       value: 'Browser localStorage' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Logo block */}
            <div
                style={{
                    padding: '20px',
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${PASTEL.blue}, ${PASTEL.purple})`,
                    border: '1px solid rgb(200,210,235)',
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: 36 }}>🧰</div>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#1e3a5f', marginTop: 6 }} className="vivitaFont">
                    VIVITA Materials
                </div>
                <div style={{ fontSize: 12, color: '#4a6a8a', marginTop: 4 }}>
                    Material management for makers
                </div>
            </div>

            {/* Info rows */}
            <div
                style={{
                    borderRadius: 12,
                    border: '1px solid #e8f0f8',
                    overflow: 'hidden',
                }}
            >
                {rows.map((row, i) => (
                    <div
                        key={row.label}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '11px 16px',
                            fontSize: 13,
                            borderBottom: i < rows.length - 1 ? '1px solid #f0f4f8' : 'none',
                            background: i % 2 === 0 ? 'white' : '#fafbfd',
                        }}
                    >
                        <span style={{ color: '#6b7280' }}>{row.label}</span>
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{row.value}</span>
                    </div>
                ))}
            </div>

            <div style={{
                padding: '12px 16px',
                background: PASTEL.peach,
                borderRadius: 12,
                fontSize: 12,
                color: '#78350f',
                border: '1px solid rgb(220,195,160)',
                lineHeight: 1.6,
            }}>
                <strong>Note:</strong> This app stores all data locally in your browser. No data is sent to external servers except AI chat messages processed by Hugging Face.
            </div>
        </div>
    );
}
