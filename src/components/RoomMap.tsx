import { useRef, useEffect, useState, useCallback } from 'react';
import { FloorElement } from "../types";

const STYLE: any = {
    compartment: { bg: '#D2E7F3', border: '#60A5FA', text: '#1E3A8A' },
    outofbounds: { bg: '#D1D5DB', border: '#9CA3AF', text: '#374151' },
    stairs: { bg: '#F9F4CE', border: '#CA8A04', text: '#78350F' },
    lift: { bg: '#E2CDEC', border: '#A855F7', text: '#6B21A8' },
    chair: { bg: '#F4D4D3', border: '#F87171', text: '#991B1B' },
    table: { bg: '#F9DFBC', border: '#FB923C', text: '#9A3412' },
    workplace: { bg: '#E2CDEC', border: '#A855F7', text: '#6B21A8' },
};

/* ---------------- CAMERA STATE ---------------- */
function createCamera() {
    return {
        pan: { x: 0, y: 0 },
        zoom: 1,
        velocity: { x: 0, y: 0 }, // inertia
        targetZoom: 1,
    };
}

/* ---------------- RECT ---------------- */
function elRect(el: FloorElement, W: number, H: number, cam: any) {
    const s = 0.1;
    return {
        x: cam.pan.x + (el.x / 100) * W * cam.zoom * s,
        y: cam.pan.y + (el.y / 100) * H * cam.zoom * s,
        w: (el.width / 100) * W * cam.zoom * s,
        h: (el.height / 100) * H * cam.zoom * s,
    };
}

/* ---------------- GRID ---------------- */
function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number, cam: any) {
    const step = 40 * cam.zoom;

    ctx.save();
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    const offsetX = cam.pan.x % step;
    const offsetY = cam.pan.y % step;

    for (let x = offsetX; x < W; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }

    for (let y = offsetY; y < H; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }

    ctx.restore();
}

/* ---------------- DRAW ELEMENT ---------------- */
function renderEl(ctx: any, el: FloorElement, r: any, cam: any, isSel: boolean, isHov: boolean) {
    const s = STYLE[el.type] ?? STYLE.compartment;

    ctx.save();

    ctx.fillStyle = s.bg;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    ctx.strokeStyle = isSel ? '#F59E0B' : isHov ? '#60A5FA' : s.border;
    ctx.lineWidth = isSel ? 3 : 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // label (crisp)
    ctx.fillStyle = s.text;
    ctx.font = `${12}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.name ?? el.id, r.x + r.w / 2, r.y + r.h / 2);

    ctx.restore();
}

/* ---------------- COMPONENT ---------------- */
export function RoomMap({ floors = [], onCompartmentClick }: any) {

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const cam = useRef(createCamera());
    const drag = useRef<any>(null);
    const pinch = useRef<any>(null);

    const [cursor, setCursor] = useState('grab');

    const floor = floors[0] ?? null;

    /* ---------------- RENDER LOOP ---------------- */
    const draw = useCallback(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const W = canvas.width;
        const H = canvas.height;

        const c = cam.current;

        ctx.clearRect(0, 0, W, H);

        ctx.fillStyle = '#F9FAFB';
        ctx.fillRect(0, 0, W, H);

        drawGrid(ctx, W, H, c);

        if (floor) {
            for (const el of floor.elements) {
                const r = elRect(el, W, H, c);
                renderEl(ctx, el, r, c, false, false);
            }
        }
    }, [floor]);

    /* ---------------- HIGH DPI + RESIZE ---------------- */
    useEffect(() => {
        const canvas = canvasRef.current!;
        const container = containerRef.current!;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';

            const ctx = canvas.getContext('2d')!;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            draw();
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(container);

        return () => ro.disconnect();
    }, [draw]);

    /* ---------------- ANIMATION LOOP (SMOOTH) ---------------- */
    useEffect(() => {
        let raf: number;

        const loop = () => {
            const c = cam.current;

            // inertia
            c.pan.x += c.velocity.x;
            c.pan.y += c.velocity.y;

            c.velocity.x *= 0.9;
            c.velocity.y *= 0.9;

            // smooth zoom
            c.zoom += (c.targetZoom - c.zoom) * 0.15;

            draw();
            raf = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(raf);
    }, [draw]);

    /* ---------------- HIT TEST ---------------- */
    const hitTest = (x: number, y: number) => {
        const canvas = canvasRef.current!;
        const c = cam.current;

        return floor?.elements.find(el => {
            const r = elRect(el, canvas.width, canvas.height, c);
            return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
        });
    };

    const getPos = (e: any) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();

        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);

        return { x, y };
    };

    /* ---------------- MOUSE ---------------- */
    const onMouseDown = (e: any) => {
        drag.current = {
            x: e.clientX,
            y: e.clientY,
        };

        const pos = getPos(e);
        const hit = hitTest(pos.x, pos.y);

        if (hit?.type === 'compartment') {
            onCompartmentClick?.(hit.id);
        }

        setCursor('grabbing');
    };

    const onMouseMove = (e: any) => {
        const c = cam.current;

        if (drag.current) {
            const dx = e.clientX - drag.current.x;
            const dy = e.clientY - drag.current.y;

            c.velocity.x = dx;
            c.velocity.y = dy;

            drag.current = { x: e.clientX, y: e.clientY };
            return;
        }

        const pos = getPos(e);
        const hit = hitTest(pos.x, pos.y);

        setCursor(hit ? 'pointer' : 'grab');
    };

    const onMouseUp = () => {
        drag.current = null;
        setCursor('grab');
    };

    /* ---------------- WHEEL ZOOM ---------------- */
    const onWheel = (e: any) => {
        e.preventDefault();

        const c = cam.current;
        const scale = e.deltaY > 0 ? 0.9 : 1.1;

        const newZoom = Math.max(0.05, Math.min(6, c.targetZoom * scale));

        c.targetZoom = newZoom;
    };

    /* ---------------- PINCH ZOOM ---------------- */
    const onTouchStart = (e: any) => {
        if (e.touches.length === 2) {
            const [a, b] = e.touches;
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

            pinch.current = {
                dist,
                zoom: cam.current.targetZoom,
            };
        }
    };

    const onTouchMove = (e: any) => {
        if (e.touches.length === 2 && pinch.current) {
            e.preventDefault();

            const [a, b] = e.touches;
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

            const scale = dist / pinch.current.dist;

            cam.current.targetZoom = Math.max(
                0.05,
                Math.min(6, pinch.current.zoom * scale)
            );
        }
    };

    const onTouchEnd = () => {
        pinch.current = null;
    };
    useEffect(() => {
        const canvas = canvasRef.current!;
        const c = cam.current;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();

            const scale = e.deltaY > 0 ? 0.9 : 1.1;
            c.targetZoom = Math.max(0.05, Math.min(6, c.targetZoom * scale));
        };

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 2 || !pinch.current) return;

            e.preventDefault();

            const [a, b] = e.touches;
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

            const scale = dist / pinch.current.dist;

            c.targetZoom = Math.max(
                0.05,
                Math.min(6, pinch.current.zoom * scale)
            );
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('touchmove', onTouchMove);
        };
    }, []);

    /* ---------------- UI ---------------- */
    return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    cursor,
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        touchAction: 'none',
                        display: 'block',
                    }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                />
                <div
                    style={{
                        position: 'absolute',
                        right: 12,
                        bottom: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        zIndex: 10,
                    }}
                >
                    <button onClick={() => cam.current.targetZoom = Math.min(6, cam.current.targetZoom * 1.2)} style={btn1}>
                        +
                    </button>

                    <button onClick={() => cam.current.targetZoom = Math.max(0.05, cam.current.targetZoom * 0.8)} style={btn1}>
                        -
                    </button>

                    <button
                        onClick={() => {
                            cam.current.pan = { x: 0, y: 0 };
                            cam.current.targetZoom = 1;
                        }}
                        style={btn}
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}
const btn: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: 12,
    border: '1px solid #d1d5db',
    background: 'white',
    borderRadius: 6,
    cursor: 'pointer',
    color:"black"
};
const btn1: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: 20,
    border: '1px solid #d1d5db',
    background: 'white',
    borderRadius: 6,
    cursor: 'pointer',
    color:"black"
};