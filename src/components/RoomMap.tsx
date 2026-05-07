import { useRef, useEffect, useState, useCallback } from 'react';
import { Layers } from 'lucide-react';
import {ElementType, FloorElement, Material} from "../types";

// ─── Style map ────────────────────────────────────────────────────────────────

const STYLE = {
    compartment: { bg: '#D2E7F3', border: '#60A5FA', text: '#1E3A8A' },
    outofbounds:  { bg: '#D1D5DB', border: '#9CA3AF', text: '#374151' },
    stairs:       { bg: '#F9F4CE', border: '#CA8A04', text: '#78350F' },
    lift:         { bg: '#E2CDEC', border: '#A855F7', text: '#6B21A8' },
    chair:        { bg: '#F4D4D3', border: '#F87171', text: '#991B1B' },
    table:        { bg: '#F9DFBC', border: '#FB923C', text: '#9A3412' },
    workplace:    { bg: '#E2CDEC', border: '#A855F7', text: '#6B21A8' },
};

const LEGEND = [
    { type: 'compartment', label: 'Compartment' },
    { type: 'outofbounds', label: 'Out of bounds' },
    { type: 'stairs',      label: 'Stairs' },
    { type: 'lift',        label: 'Lift' },
    { type: 'chair',       label: 'Chair' },
    { type: 'table',       label: 'Table' },
    { type: 'workplace',   label: 'Workplace' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elRect(el:FloorElement, W, H, pan, zoom) {
    return {
        x: pan.x + (el.x / 100) * W * zoom,
        y: pan.y + (el.y / 100) * H * zoom,
        w: (el.width  / 100) * W * zoom,
        h: (el.height / 100) * H * zoom,
    };
}

function renderEl(ctx, el:FloorElement, W, H, pan, zoom, isSel, isHov, materials:Material[]) {
    const r = elRect(el, W, H, pan, zoom);
    const { x, y, w, h } = r;
    const s = STYLE[el.type] ?? STYLE.compartment;
    ctx.save();

    if (el.type === 'outofbounds') {
        ctx.fillStyle = s.bg;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#9CA3AF'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -(h + w); i < w + h; i += 14 * zoom) {
            ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h);
        }
        ctx.stroke();

    } else if (el.type === 'stairs') {
        ctx.fillStyle = s.bg; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = s.border; ctx.lineWidth = 1.5;
        const steps = Math.max(3, Math.round(h / 16)), sh = h / steps;
        for (let i = 0; i < steps; i++) ctx.strokeRect(x + 2, y + i * sh, w * (1 - i / steps) - 4, sh);
        ctx.fillStyle = s.text;
        ctx.font = `bold ${Math.min(11, w * 0.2)}px system-ui`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('STAIRS', x + w / 2, y + h - 4);

    } else if (el.type === 'lift') {
        ctx.fillStyle = s.bg; ctx.fillRect(x, y, w, h);
        const fs = Math.min(w * 0.45, h * 0.45, 28);
        ctx.font = `bold ${fs}px system-ui`; ctx.fillStyle = s.border;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⇅', x + w / 2, y + h / 2 - fs * 0.1);
        ctx.font = `bold ${Math.min(10, w * 0.18)}px system-ui`;
        ctx.fillStyle = s.text; ctx.textBaseline = 'bottom';
        ctx.fillText('LIFT', x + w / 2, y + h - 4);

    } else if (el.type === 'chair') {
        ctx.fillStyle = s.bg; ctx.fillRect(x, y, w, h);
        const fs = Math.min(w * 0.6, h * 0.6, 32);
        ctx.font = `${fs}px system-ui`; ctx.fillStyle = s.text;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🪑', x + w / 2, y + h / 2);

    } else if (el.type === 'table') {
        ctx.fillStyle = s.bg; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = s.border; ctx.lineWidth = 2;
        const mg = Math.min(w, h) * 0.15;
        ctx.strokeRect(x + mg, y + mg, w - 2 * mg, h - 2 * mg);
        ctx.font = `bold ${Math.min(w * 0.15, h * 0.15, 10)}px system-ui`;
        ctx.fillStyle = s.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('TABLE', x + w / 2, y + h / 2);

    } else if (el.type === 'workplace') {
        ctx.fillStyle = s.bg; ctx.fillRect(x, y, w, h);
        const fs = Math.min(w * 0.5, h * 0.5, 28);
        ctx.font = `${fs}px system-ui`; ctx.fillStyle = s.text;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('💼', x + w / 2, y + h / 2 - fs * 0.15);
        ctx.font = `bold ${Math.min(9, w * 0.15)}px system-ui`;
        ctx.textBaseline = 'bottom';
        ctx.fillText('WORK', x + w / 2, y + h - 4);

    } else {
        // compartment
        ctx.fillStyle = el.color ?? s.bg;
        ctx.fillRect(x, y, w, h);
        const count = (materials ?? []).filter(m => m.compartmentId === el.id).length;
        const ns = Math.min(w * 0.38, h * 0.38, 22), ts = Math.min(ns * 0.72, 13);
        ctx.fillStyle = s.text; ctx.textAlign = 'center';
        if (el.number) {
            ctx.font = `bold ${ns}px system-ui`; ctx.textBaseline = 'middle';
            ctx.fillText(el.number, x + w / 2, y + h / 2 - (el.name ? ns * 0.55 : 0));
        }
        if (el.name) {
            ctx.font = `${ts}px system-ui`; ctx.textBaseline = 'middle';
            const label = el.name.length > 12 ? el.name.slice(0, 11) + '…' : el.name;
            ctx.fillText(label, x + w / 2, y + h / 2 + (el.number ? ns * 0.55 : 0));
        }
        if (count > 0 && w > 36 && h > 24) {
            const br = Math.min(10, w * 0.18);
            const bx = x + w - br - 4, by = y + br + 4;
            ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fillStyle = '#1D4ED8'; ctx.fill();
            ctx.font = `bold ${br * 1.1}px system-ui`;
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(count), bx, by);
        }
    }

    ctx.strokeStyle = isSel ? '#F59E0B' : (isHov && el.type === 'compartment') ? '#60A5FA' : s.border;
    ctx.lineWidth   = isSel ? 3 : 1.5;
    if (isSel) { ctx.shadowColor = '#F59E0B'; ctx.shadowBlur = 8; }
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.shadowBlur = 0;
    ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoomMap({
                            floors = [],
                            materials = [],
                            selectedCompartment,
                            onCompartmentClick,
                            isAdmin = false,
                            floorplanImage,
                            onFloorplanUpload,
                        }) {
    const canvasRef    = useRef(null);
    const containerRef = useRef(null);
    const bgImageRef   = useRef(null);
    const stateRef     = useRef({ pan: { x: 0, y: 0 }, zoom: 1, selectedId: null, hoveredId: null });
    const dragRef      = useRef(null);
    const drawRef      = useRef(() => {});

    const [currentFloorIdx, setCurrentFloorIdx] = useState(0);
    const [zoom, setZoom]     = useState(1);
    const [cursor, setCursor] = useState('grab');

    const currentFloor = floors[currentFloorIdx] ?? null;
    const selectedEl   = currentFloor?.elements.find(e => e.id === selectedCompartment) ?? null;
    const compartmentMats = selectedEl?.type === 'compartment'
        ? materials.filter(m => m.compartmentId === selectedCompartment)
        : [];

    // ── Floorplan image ───────────────────────────────────────────────────────

    useEffect(() => {
        if (!floorplanImage) { bgImageRef.current = null; drawRef.current(); return; }
        const img = new Image();
        img.onload = () => { bgImageRef.current = img; drawRef.current(); };
        img.src = floorplanImage;
    }, [floorplanImage]);

    // ── Draw ──────────────────────────────────────────────────────────────────

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const { pan, zoom, selectedId, hoveredId } = stateRef.current;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#F9FAFB';
        ctx.fillRect(0, 0, W, H);

        // Grid
        const GRID = 40 * zoom;
        ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1;
        const offX = pan.x % GRID, offY = pan.y % GRID;
        for (let x = offX; x < W; x += GRID) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
        for (let y = offY; y < H; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }

        // Background image
        if (bgImageRef.current) {
            ctx.save(); ctx.globalAlpha = 0.35;
            const img = bgImageRef.current;
            const scale = Math.min((W * zoom) / img.width, (H * zoom) / img.height);
            const iw = img.width * scale, ih = img.height * scale;
            ctx.drawImage(img, pan.x + (W * zoom - iw) / 2, pan.y + (H * zoom - ih) / 2, iw, ih);
            ctx.restore();
        }

        if (!currentFloor) return;

        const sorted = [
            ...currentFloor.elements.filter(e => e.id !== selectedId),
            ...currentFloor.elements.filter(e => e.id === selectedId),
        ];
        for (const el of sorted) {
            renderEl(ctx, el, W, H, pan, zoom, el.id === selectedId, el.id === hoveredId, materials);
        }
    }, [currentFloor, materials]);

    drawRef.current = draw;
    useEffect(() => { draw(); }, [draw]);

    // ── Sync selected prop → ref ──────────────────────────────────────────────

    useEffect(() => {
        stateRef.current.selectedId = selectedCompartment ?? null;
        draw();
    }, [selectedCompartment, draw]);

    // ── Canvas resize ─────────────────────────────────────────────────────────

    useEffect(() => {
        const container = containerRef.current, canvas = canvasRef.current;
        if (!container || !canvas) return;
        const ro = new ResizeObserver(() => {
            canvas.width  = container.clientWidth;
            canvas.height = container.clientHeight;
            drawRef.current();
        });
        ro.observe(container);
        return () => ro.disconnect();
    }, []);

    // ── Hit test ──────────────────────────────────────────────────────────────

    const hitTest = useCallback((px, py) => {
        const canvas = canvasRef.current;
        if (!canvas || !currentFloor) return null;
        const { pan, zoom } = stateRef.current;
        return [...currentFloor.elements].reverse().find(el => {
            const r = elRect(el, canvas.width, canvas.height, pan, zoom);
            return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
        });
    }, [currentFloor]);

    // ── Mouse events ──────────────────────────────────────────────────────────

    const getPos = e => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) * (canvas.width  / rect.width),
            y: (clientY - rect.top)  * (canvas.height / rect.height),
        };
    };

    const onMouseDown = e => {
        const pos = getPos(e);
        const clientX = e.touches?.[0]?.clientX ?? e.clientX;
        const clientY = e.touches?.[0]?.clientY ?? e.clientY;
        dragRef.current = { startMouse: { x: clientX, y: clientY }, startPan: { ...stateRef.current.pan }, moved: false };
        setCursor('grabbing');
        const hit = hitTest(pos.x, pos.y);
        if (hit?.type === 'compartment') {
            stateRef.current.selectedId = hit.id;
            onCompartmentClick?.(hit.id);
        } else if (!hit) {
            stateRef.current.selectedId = null;
            onCompartmentClick?.(null);
        }
        draw();
    };

    const onMouseMove = e => {
        const clientX = e.touches?.[0]?.clientX ?? e.clientX;
        const clientY = e.touches?.[0]?.clientY ?? e.clientY;

        if (dragRef.current) {
            const dx = clientX - dragRef.current.startMouse.x;
            const dy = clientY - dragRef.current.startMouse.y;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
            stateRef.current.pan = { x: dragRef.current.startPan.x + dx, y: dragRef.current.startPan.y + dy };
            draw(); setCursor('grabbing'); return;
        }
        const pos  = getPos(e);
        const hit  = hitTest(pos.x, pos.y);
        const newH = hit?.id ?? null;
        if (newH !== stateRef.current.hoveredId) { stateRef.current.hoveredId = newH; draw(); }
        setCursor(hit?.type === 'compartment' ? 'pointer' : 'grab');
    };

    const onMouseUp = e => {
        const moved = dragRef.current?.moved;
        dragRef.current = null;
        if (moved) { stateRef.current.selectedId = null; onCompartmentClick?.(null); draw(); }
        const pos = getPos(e);
        const hit = hitTest(pos.x, pos.y);
        setCursor(hit?.type === 'compartment' ? 'pointer' : 'grab');
    };

    const onWheel = e => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const rect   = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width  / rect.width);
        const my = (e.clientY - rect.top)  * (canvas.height / rect.height);
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const oldZ  = stateRef.current.zoom;
        const newZ  = Math.max(0.3, Math.min(4, oldZ * delta));
        stateRef.current.pan.x = mx - (mx - stateRef.current.pan.x) * (newZ / oldZ);
        stateRef.current.pan.y = my - (my - stateRef.current.pan.y) * (newZ / oldZ);
        stateRef.current.zoom  = newZ;
        setZoom(newZ); draw();
    };

    const adjustZoom = factor => {
        const canvas = canvasRef.current;
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const oldZ = stateRef.current.zoom;
        const newZ = Math.max(0.3, Math.min(4, oldZ * factor));
        stateRef.current.pan.x = cx - (cx - stateRef.current.pan.x) * (newZ / oldZ);
        stateRef.current.pan.y = cy - (cy - stateRef.current.pan.y) * (newZ / oldZ);
        stateRef.current.zoom  = newZ;
        setZoom(newZ); draw();
    };

    const resetView = () => {
        stateRef.current.pan  = { x: 0, y: 0 };
        stateRef.current.zoom = 1;
        setZoom(1); draw();
    };

    const switchFloor = i => {
        setCurrentFloorIdx(i);
        stateRef.current.selectedId = null;
        onCompartmentClick?.(null);
    };

    useEffect(() => { draw(); }, [currentFloorIdx, draw]);

    const handleFileUpload = e => {
        const file = e.target.files?.[0];
        if (file && onFloorplanUpload) {
            const reader = new FileReader();
            reader.onload = ev => onFloorplanUpload(ev.target?.result);
            reader.readAsDataURL(file);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="flex overflow-hidden bg-white" style={{ height: '100%' }}>

            {/* ═══ LEFT SIDEBAR ═══ */}
            <div className="w-36 sm:w-44 shrink-0 flex flex-col bg-gray-50 border-r border-gray-200 overflow-y-auto hidden md:flex">

                {/* Floors */}
                <div className="p-3 border-b border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Floors</p>
                    <div className="space-y-1">
                        {floors.map((f, i) => (
                            <button
                                key={f.id}
                                onClick={() => switchFloor(i)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                    i === currentFloorIdx
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {f.name}
                                <span className="ml-1 opacity-60 font-normal">
                  ({f.elements.filter(e => e.type === 'compartment').length})
                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Floorplan upload (admin only) */}
                {isAdmin && onFloorplanUpload && (
                    <div className="p-3 border-b border-gray-200">
                        <label className="w-full flex items-center justify-center px-2 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-blue-700 transition-colors">
                            {floorplanImage ? 'Change Image' : 'Upload Image'}
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>
                )}

                {/* Legend */}
                <div className="p-3 flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Legend</p>
                    <div className="space-y-1.5">
                        {LEGEND.map(({ type, label }) => (
                            <div key={type} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-sm border flex-shrink-0"
                                    style={{ backgroundColor: STYLE[type].bg, borderColor: STYLE[type].border }}
                                />
                                <span className="text-[10px] text-gray-500">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ CANVAS ═══ */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-9 bg-white border-b border-gray-200 flex items-center px-3 sm:px-4 gap-2 shrink-0">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{currentFloor?.name ?? '—'}</span>
                    <span className="ml-auto text-xs text-gray-400 hidden lg:block">
            {isAdmin ? 'Click to select · Drag to pan · Scroll to zoom' : 'Click compartments · Drag to pan · Scroll to zoom'}
          </span>

                    {/* Mobile floor selector */}
                    {floors.length > 1 && (
                        <select
                            value={currentFloorIdx}
                            onChange={(e) => switchFloor(Number(e.target.value))}
                            className="md:hidden ml-auto px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"
                        >
                            {floors.map((f, i) => (
                                <option key={f.id} value={i}>
                                    {f.name} ({f.elements.filter(e => e.type === 'compartment').length})
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div ref={containerRef} className="relative flex-1" style={{ cursor }}>
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 touch-none"
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={() => {
                            dragRef.current = null;
                            stateRef.current.hoveredId = null;
                            setCursor('grab');
                            draw();
                        }}
                        onWheel={onWheel}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            onMouseDown(e);
                        }}
                        onTouchMove={(e) => {
                            e.preventDefault();
                            onMouseMove(e);
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            onMouseUp(e);
                        }}
                    />

                    {currentFloor?.elements.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center text-gray-400">
                                <p className="font-medium">No compartments configured</p>
                                {isAdmin && <p className="text-sm mt-1">Add compartments in the editor</p>}
                            </div>
                        </div>
                    )}

                    {/* Zoom controls */}
                    <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
                        <button onClick={() => adjustZoom(1.2)} className="w-8 h-8 sm:w-9 sm:h-9 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-lg sm:text-xl font-medium flex items-center justify-center shadow-md active:scale-95 transition-transform">+</button>
                        <div className="text-[10px] text-gray-400 text-center select-none font-medium">{Math.round(zoom * 100)}%</div>
                        <button onClick={() => adjustZoom(1 / 1.2)} className="w-8 h-8 sm:w-9 sm:h-9 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-lg sm:text-xl font-medium flex items-center justify-center shadow-md active:scale-95 transition-transform">−</button>
                        <button onClick={resetView} title="Reset view" className="w-8 h-8 sm:w-9 sm:h-9 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 text-sm sm:text-base flex items-center justify-center shadow-md active:scale-95 transition-transform">⤢</button>
                    </div>
                </div>
            </div>

            {/* ═══ RIGHT SIDEBAR — Materials ═══ */}
            {/* <div className="w-48 shrink-0 flex flex-col bg-gray-50 border-l border-gray-200 overflow-hidden">
        <div className="p-3 border-b border-gray-200 shrink-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Materials</p>
          {selectedEl?.type === 'compartment' && (
            <div className="mt-1.5">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {selectedEl.number ? `#${selectedEl.number} ` : ''}{selectedEl.name}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
                {compartmentMats.length} item{compartmentMats.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!selectedEl || selectedEl.type !== 'compartment' ? (
            <p className="text-xs text-gray-400 text-center py-8">
              Click a compartment on the map
            </p>
          ) : compartmentMats.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No materials here</p>
          ) : (
            compartmentMats.map(m => (
              <div key={m.id} className="bg-white rounded-lg border border-gray-200 p-2 text-xs">
                <div className="font-semibold text-gray-800 truncate">{m.name}</div>
                {m.description && <div className="text-gray-500 truncate mt-0.5">{m.description}</div>}
                <div className="mt-1 font-medium text-gray-700">{m.quantity} {m.unit}</div>
              </div>
            ))
          )}
        </div>
      </div> */}
        </div>
    );
}