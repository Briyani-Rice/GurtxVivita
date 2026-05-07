import { useState } from 'react';
import { Search, Package, MapPin, Send, Check, X, Map, List, ChevronDown, ChevronUp } from 'lucide-react';
import { Material, FloorData, FloorElement, MaterialRequest } from '../types';
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

export function UserView({ floors, materials, requests, onSubmitRequest, prefs }: UserViewProps) {
    const [activeTab, setActiveTab]               = useState<UserTab>('map');
    const [search, setSearch]                     = useState('');
    const [requesting, setRequesting]             = useState<Material | null>(null);
    const [reqQty, setReqQty]                     = useState('1');
    const [reqReason, setReqReason]               = useState('');
    const [submitted, setSubmitted]               = useState(false);
    const [selectedCompartment, setSelectedCompartment] = useState<string | null>(null);
    const [compartmentPanelOpen, setCompartmentPanelOpen] = useState(true);

    // Helpers for location lookup
    const allCompartments: FloorElement[] = floors.flatMap(f =>
        f.elements.filter(e => e.type === 'compartment')
    );
    const getCompartment = (id: string) => allCompartments.find(c => c.id === id);
    const compartmentFloor = (id: string) =>
        floors.find(f => f.elements.some(e => e.id === id))?.name ?? '';

    const handleRequest = () => {
        if (!requesting || !reqQty) return;
        onSubmitRequest(requesting.id, Number(reqQty), reqReason);
        setSubmitted(true);
        setTimeout(() => {
            setRequesting(null);
            setSubmitted(false);
            setReqQty('1');
            setReqReason('');
        }, 1000);
    };

    const handleCompartmentClick = (id: string | null) => {
        setSelectedCompartment(id);
        if (id) setCompartmentPanelOpen(true);
    };

    const myRequests = requests.filter(r => r.status === 'pending');

    const filteredMaterials = materials.filter(m => {
        const matchesSearch =
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.description.toLowerCase().includes(search.toLowerCase());
        const matchesCompartment = !selectedCompartment || m.compartmentId === selectedCompartment;
        const matchesStock = prefs?.hideOutOfStock ? m.quantity > 0 : true;
        return matchesSearch && matchesCompartment && matchesStock;
    });

    const selectedComp = selectedCompartment ? getCompartment(selectedCompartment) as (FloorElement & { number?: string; name?: string; color?: string }) | undefined : undefined;
    const selectedCompMaterials = selectedCompartment ? materials.filter(m => m.compartmentId === selectedCompartment) : [];

    const TABS = [
        { id: 'map' as UserTab, label: 'Room Map', Icon: Map },
        { id: 'materials' as UserTab, label: 'Materials', Icon: List },
    ];

    return (
        <div className="flex-1 flex flex-col min-h-0">

            {/* ── Tab Bar ── */}
            <div className="bg-white border-b border-gray-200 flex items-center px-2 sm:px-4 shrink-0 gap-1 overflow-x-auto">
                {TABS.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap shrink-0 ${
                            activeTab === id
                                ? 'border-blue-500 text-blue-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{label}</span>
                        {id === 'materials' && myRequests.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                {myRequests.length}
              </span>
                        )}
                    </button>
                ))}
                {/* Compartment filter chip in tab bar when on materials tab */}
                {activeTab === 'materials' && selectedCompartment && selectedComp && (
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border"
                             style={{ backgroundColor: (selectedComp.color ?? '#D2E7F3') + '55', borderColor: selectedComp.color ?? '#60A5FA', color: '#1E40AF' }}
                        >
                            <MapPin className="w-3 h-3" />
                            <span className="hidden sm:inline">{selectedComp.number} · {selectedComp.name}</span>
                            <span className="sm:hidden">{selectedComp.number}</span>
                            <button
                                onClick={() => setSelectedCompartment(null)}
                                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Map Tab ── */}
            {activeTab === 'map' && (
                <div className="flex-1 min-h-0 relative overflow-hidden">
                    {/* Full-height RoomMap */}
                    <div className="absolute inset-0">
                        <RoomMap
                            floors={floors}
                            materials={materials}
                            selectedCompartment={selectedCompartment}
                            onCompartmentClick={handleCompartmentClick}
                            isAdmin={false}
                        />
                    </div>

                    {/* Floating compartment detail panel — slides up from bottom */}
                    {selectedComp && (
                        <div
                            className="absolute bottom-0 left-0 right-0 z-20 transition-all duration-300"
                            style={{
                                background: 'rgba(255,255,255,0.97)',
                                backdropFilter: 'blur(12px)',
                                borderTop: '1px solid #E5E7EB',
                                boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
                                maxHeight: compartmentPanelOpen ? '80vh' : 48,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Panel header */}
                            <div
                                className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 cursor-pointer select-none"
                                onClick={() => setCompartmentPanelOpen(p => !p)}
                            >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 shrink-0"
                                        style={{ backgroundColor: (selectedComp.color ?? '#D2E7F3') + 'dd', borderColor: selectedComp.color ?? '#60A5FA' }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                      <span className="vivitaFont font-semibold text-gray-900 text-sm truncate">
                        {selectedComp.number ? `${selectedComp.number} · ` : ''}{selectedComp.name}
                      </span>
                                            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
                        {selectedCompMaterials.length} item{selectedCompMaterials.length !== 1 ? 's' : ''}
                      </span>
                                        </div>
                                        <span className="text-[10px] sm:text-xs text-gray-400 block">{compartmentFloor(selectedCompartment!)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                    <button
                                        onClick={e => { e.stopPropagation(); setActiveTab('materials'); }}
                                        className="hidden sm:flex px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                                    >
                                        Browse all
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); setSelectedCompartment(null); }}
                                        className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    {compartmentPanelOpen
                                        ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                        : <ChevronUp className="w-4 h-4 text-gray-400" />
                                    }
                                </div>
                            </div>

                            {/* Materials list */}
                            {compartmentPanelOpen && (
                                <div className="px-3 sm:px-5 pb-3 sm:pb-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
                                    {selectedCompMaterials.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400">
                                            <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No materials in this compartment</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {selectedCompMaterials.map(m => {
                                                const empty = m.quantity <= 0;
                                                const userReq = requests.find(r => r.materialId === m.id && r.status === 'pending');
                                                return (
                                                    <div
                                                        key={m.id}
                                                        className={`bg-white rounded-xl border p-3 flex flex-col gap-2 shadow-sm ${empty ? 'border-red-200 opacity-75' : 'border-gray-200'}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-1">
                                                            <p className="vivitaFont font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${empty ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                {empty ? 'Out' : `${m.quantity} ${m.unit}`}
                              </span>
                                                        </div>
                                                        {m.description && <p className="text-xs text-gray-400 truncate">{m.description}</p>}
                                                        {userReq ? (
                                                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-700">
                                                                <span className="animate-pulse">●</span> Pending
                                                            </div>
                                                        ) : (
                                                            <button
                                                                disabled={empty}
                                                                onClick={() => { setRequesting(m); setReqQty('1'); setReqReason(''); setSubmitted(false); }}
                                                                className="mt-auto flex items-center justify-center gap-1 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                <Send className="w-3 h-3" /> Request
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hint when nothing is selected */}
                    {!selectedCompartment && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-3">
                            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/90 backdrop-blur-sm rounded-full border border-gray-200 shadow-md text-[10px] sm:text-xs text-gray-500 text-center">
                                Tap a compartment to view materials
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Materials Tab ── */}
            {activeTab === 'materials' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Search bar */}
                    <div className="bg-white border-b border-gray-100 px-4 py-3 shrink-0">
                        <div className="relative max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search materials…"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Materials grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredMaterials.length === 0 && (
                            <div className="text-center py-24 text-gray-400">
                                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No materials found</p>
                                {search && <p className="text-sm mt-1">Try a different search term</p>}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filteredMaterials.map(m => {
                                const comp    = getCompartment(m.compartmentId) as (FloorElement & { number?: string; name?: string; color?: string }) | undefined;
                                const floor   = compartmentFloor(m.compartmentId);
                                const empty   = m.quantity <= 0;
                                const userReq = requests.find(r => r.materialId === m.id && r.status === 'pending');
                                return (
                                    <div
                                        key={m.id}
                                        className={`bg-white rounded-2xl border shadow-sm flex flex-col transition-all hover:shadow-md ${
                                            prefs?.compactCards ? 'p-3 gap-2' : 'p-4 gap-3'
                                        } ${empty ? 'border-red-200 opacity-75' : 'border-gray-200'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="vivitaFont font-semibold text-gray-900 truncate">{m.name}</p>
                                                {m.description && <p className="text-xs text-gray-500 truncate mt-0.5">{m.description}</p>}
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                                                empty ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                                            }`}>
                        {empty ? 'Out of stock' : `${m.quantity} ${m.unit}`}
                      </span>
                                        </div>

                                        {comp && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                <button
                                                    onClick={() => {
                                                        setSelectedCompartment(comp.id);
                                                        setActiveTab('map');
                                                    }}
                                                    className="vivitaFont px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer"
                                                    style={{ backgroundColor: (comp.color ?? '#D2E7F3') + '88', color: '#1E40AF' }}
                                                >
                                                    {comp.number} · {comp.name}
                                                </button>
                                                <span className="text-gray-400">{floor}</span>
                                            </div>
                                        )}

                                        {userReq ? (
                                            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                                                <span className="animate-pulse">●</span> Request pending
                                            </div>
                                        ) : (
                                            <button
                                                disabled={empty}
                                                onClick={() => { setRequesting(m); setReqQty('1'); setReqReason(''); setSubmitted(false); }}
                                                className="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <Send className="w-3.5 h-3.5" /> Request
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pending requests strip */}
                        {myRequests.length > 0 && (
                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                <p className="vivitaFont text-sm font-semibold text-amber-800 mb-2">
                                    Your pending requests ({myRequests.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {myRequests.map(r => (
                                        <span key={r.id} className="px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
                      {r.materialName} × {r.requestedQuantity}
                    </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Request modal ── */}
            {requesting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 w-full max-w-sm">
                        {submitted ? (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <Check className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="font-semibold text-gray-800">Request submitted!</p>
                                <p className="text-sm text-gray-500 text-center">An admin will review your request.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="vivitaFont font-semibold text-gray-900">Request material</h3>
                                    <button onClick={() => setRequesting(null)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="vivitaFont text-sm font-medium text-gray-700 mb-3">{requesting.name}</p>

                                <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={requesting.quantity}
                                    value={reqQty}
                                    onChange={e => setReqQty(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />

                                <label className="block text-xs text-gray-500 mb-1">
                                    Reason <span className="text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    value={reqReason}
                                    onChange={e => setReqReason(e.target.value)}
                                    rows={3}
                                    placeholder="What do you need this for?"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                />

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleRequest}
                                        disabled={!reqQty || Number(reqQty) <= 0}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
                                    >
                                        <Send className="w-4 h-4" /> Submit
                                    </button>
                                    <button
                                        onClick={() => setRequesting(null)}
                                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                                    >
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
