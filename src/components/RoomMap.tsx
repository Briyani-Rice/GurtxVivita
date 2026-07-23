import { useRef, useEffect, useState, useCallback } from "react";
import type { FloorElement, Material } from "../types";
import {
    getAreaInventory,
} from "../utils/roomMapInventory";
import { clampZoom, panForZoomAtPoint, type Vec2 } from "../utils/cameraZoom";

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.5;

type RoomMapProps = {
    floors?: Array<{
        id: string;
        name: string;
        elements: FloorElement[];
    }>;
    materials?: Material[];
    onCompartmentClick?: (areaId: string) => void;
    selectedCompartment?: string | null;
};

type CameraState = {
    pan: { x: number; y: number };
    zoom: number;
    targetZoom: number;
    velocity: { x: number; y: number };
};

type AreaRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};

// Wide enough to include VIVISTUDIO (spans to x≈1298) so fit-to-view and
// Reset don't crop it on the right edge.
const MAP_BOUNDS = {
    x: 60,
    y: 30,
    width: 1260,
    height: 650,
};

const STYLE: Record<string, { fill: string; stroke: string; text: string }> = {
    compartment: { fill: "#f8fafc", stroke: "#111827", text: "#111827" },
    workplace: { fill: "#fff7ed", stroke: "#f97316", text: "#9a3412" },
    table: { fill: "#FFF5CB", stroke: "#A1824F", text: "#5E4B2E" },
    chair: { fill: "#e0f2fe", stroke: "#38bdf8", text: "#075985" },
    stairs: { fill: "#ecfeff", stroke: "#06b6d4", text: "#155e75" },
    lift: { fill: "#f5f3ff", stroke: "#8b5cf6", text: "#5b21b6" },
    outofbounds: { fill: "#e5e7eb", stroke: "#6b7280", text: "#374151" },
};

const PEGBOARD_TEXT = "#4a2500";

function createCamera(): CameraState {
    return {
        pan: { x: 40, y: 40 },
        zoom: 0.95,
        targetZoom: 0.95,
        velocity: { x: 0, y: 0 },
    };
}

function fitCameraToMap(width: number, height: number): CameraState {
    const padding = Math.min(48, Math.max(18, Math.min(width, height) * 0.06));
    const availableWidth = Math.max(1, width - padding * 2);
    const availableHeight = Math.max(1, height - padding * 2);
    const zoom = Math.max(
        0.35,
        Math.min(2.5, Math.min(availableWidth / MAP_BOUNDS.width, availableHeight / MAP_BOUNDS.height)),
    );

    return {
        pan: {
            x: (width - MAP_BOUNDS.width * zoom) / 2 - MAP_BOUNDS.x * zoom,
            y: (height - MAP_BOUNDS.height * zoom) / 2 - MAP_BOUNDS.y * zoom,
        },
        zoom,
        targetZoom: zoom,
        velocity: { x: 0, y: 0 },
    };
}

function worldToScreenRect(el: FloorElement, cam: CameraState): AreaRect {
    return {
        x: cam.pan.x + el.x * cam.zoom,
        y: cam.pan.y + el.y * cam.zoom,
        w: el.width * cam.zoom,
        h: el.height * cam.zoom,
    };
}

function screenToWorld(x: number, y: number, cam: CameraState) {
    return {
        x: (x - cam.pan.x) / cam.zoom,
        y: (y - cam.pan.y) / cam.zoom,
    };
}

function isDarkTheme(): boolean {
    return typeof document !== "undefined"
        && document.documentElement.dataset.viventoryTheme === "dark";
}

function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number) {
    // Match the app theme so the map is not a bright white block in dark mode.
    ctx.fillStyle = isDarkTheme() ? "#161D26" : "#f8fafc";
    ctx.fillRect(0, 0, W, H);
}

function drawPlanShell(ctx: CanvasRenderingContext2D, cam: CameraState) {
    const x = cam.pan.x;
    const y = cam.pan.y;
    const z = cam.zoom;

    ctx.save();
    ctx.lineWidth = Math.max(2, 3 * z);
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.rect(x + 96 * z, y + 150 * z, 1080 * z, 470 * z);
    ctx.stroke();

    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = Math.max(2, 5 * z);
    ctx.setLineDash([24 * z, 16 * z]);
    ctx.strokeRect(x + 70 * z, y + 60 * z, 1180 * z, 610 * z);
    ctx.setLineDash([]);

    ctx.fillStyle = "#166534";
    ctx.font = `${Math.max(12, 22 * z)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("GREEN BUFFER", x + 600 * z, y + 42 * z);

    ctx.restore();
}

function drawShelves(ctx: CanvasRenderingContext2D, cam: CameraState) {
    const shelves = [
        { x: 390, y: 155, w: 180, h: 18, label: "WINDOW STORAGE" },
        { x: 600, y: 155, w: 180, h: 18, label: "WINDOW STORAGE" },
        { x: 820, y: 485, w: 170, h: 22, label: "VIVI-SHELVING" },
        { x: 840, y: 530, w: 150, h: 22, label: "VIVI-SHELVING" },
    ];

    ctx.save();
    ctx.font = `${Math.max(9, 10 * cam.zoom)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const shelf of shelves) {
        const r = {
            x: cam.pan.x + shelf.x * cam.zoom,
            y: cam.pan.y + shelf.y * cam.zoom,
            w: shelf.w * cam.zoom,
            h: shelf.h * cam.zoom,
        };

        ctx.fillStyle = "#fff7ed";
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = Math.max(1, 1.5 * cam.zoom);
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = "#9a3412";
        ctx.fillText(shelf.label, r.x + r.w / 2, r.y + r.h / 2);
    }

    ctx.restore();
}

function drawFurniture(ctx: CanvasRenderingContext2D, cam: CameraState) {
    const tables = [
        { x: 430, y: 295, w: 95, h: 56 },
        { x: 540, y: 295, w: 95, h: 56 },
        { x: 650, y: 295, w: 95, h: 56 },
        { x: 455, y: 390, w: 130, h: 56 },
        { x: 615, y: 390, w: 130, h: 56 },
        { x: 160, y: 240, w: 52, h: 150 },
    ];

    const chairs = [
        { x: 420, y: 262 }, { x: 465, y: 262 }, { x: 510, y: 262 },
        { x: 535, y: 262 }, { x: 580, y: 262 }, { x: 625, y: 262 },
        { x: 650, y: 262 }, { x: 695, y: 262 },
        { x: 470, y: 455 }, { x: 515, y: 455 }, { x: 635, y: 455 }, { x: 680, y: 455 },
        { x: 880, y: 185 }, { x: 920, y: 185 }, { x: 960, y: 185 },
    ];

    ctx.save();
    ctx.lineWidth = Math.max(1, 1.25 * cam.zoom);

    for (const table of tables) {
        const r = {
            x: cam.pan.x + table.x * cam.zoom,
            y: cam.pan.y + table.y * cam.zoom,
            w: table.w * cam.zoom,
            h: table.h * cam.zoom,
        };
        ctx.fillStyle = "#fffbeb";
        ctx.strokeStyle = "#A1824F";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
    }

    for (const chair of chairs) {
        const cx = cam.pan.x + chair.x * cam.zoom;
        const cy = cam.pan.y + chair.y * cam.zoom;
        ctx.fillStyle = "#e0f2fe";
        ctx.strokeStyle = "#38bdf8";
        ctx.beginPath();
        ctx.roundRect(cx, cy, 20 * cam.zoom, 20 * cam.zoom, 5 * cam.zoom);
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
}

function drawStairs(ctx: CanvasRenderingContext2D, rect: AreaRect) {
    ctx.save();
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 1;

    const steps = 9;
    for (let i = 1; i < steps; i += 1) {
        const y = rect.y + (rect.h / steps) * i;
        ctx.beginPath();
        ctx.moveTo(rect.x + 6, y);
        ctx.lineTo(rect.x + rect.w - 6, y);
        ctx.stroke();
    }

    ctx.restore();
}

function drawElement(
    ctx: CanvasRenderingContext2D,
    el: FloorElement,
    cam: CameraState,
    isHovered: boolean,
    isSelected: boolean,
    materialCount: number
) {
    const style = STYLE[el.type] ?? STYLE.compartment;
    const r = worldToScreenRect(el, cam);

    ctx.save();

    ctx.fillStyle = style.fill;
    ctx.strokeStyle = isSelected ? "#2563eb" : isHovered ? "#0ea5e9" : style.stroke;
    ctx.lineWidth = isSelected ? 4 : isHovered ? 3 : 2;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    if (el.type === "stairs") {
        drawStairs(ctx, r);
    }

    if (el.id === "window-wall") {
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1;
        const panes = 10;
        for (let i = 1; i < panes; i += 1) {
            const x = r.x + (r.w / panes) * i;
            ctx.beginPath();
            ctx.moveTo(x, r.y + 6);
            ctx.lineTo(x, r.y + r.h - 6);
            ctx.stroke();
        }
    }

    if (el.id === "pegboard-storage") {
        ctx.fillStyle = "#b45309";
        const gap = Math.max(8, 14 * cam.zoom);
        const dot = Math.max(1.2, 2 * cam.zoom);
        for (let y = r.y + gap; y < r.y + r.h - gap; y += gap) {
            for (let x = r.x + gap; x < r.x + r.w - gap; x += gap) {
                ctx.beginPath();
                ctx.arc(x, y, dot, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    const label = el.name ?? el.label ?? el.id;
    const labelX = r.x + r.w / 2;
    const labelY = r.y + r.h / 2 - 8;
    const labelFontSize = Math.max(11, 15 * cam.zoom);

    ctx.font = `${labelFontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (el.id === "pegboard-storage") {
        const metrics = ctx.measureText(label);
        const padX = Math.max(6, 7 * cam.zoom);
        const padY = Math.max(4, 5 * cam.zoom);
        ctx.fillStyle = "rgba(255, 253, 244, 0.92)";
        ctx.fillRect(
            labelX - metrics.width / 2 - padX,
            labelY - labelFontSize / 2 - padY,
            metrics.width + padX * 2,
            labelFontSize + padY * 2,
        );
    }

    ctx.fillStyle = el.id === "pegboard-storage" ? PEGBOARD_TEXT : style.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, labelX, labelY);

    if (materialCount > 0) {
        ctx.font = `${Math.max(10, 12 * cam.zoom)}px sans-serif`;
        ctx.fillStyle = "#2563eb";
        // Count of distinct materials (types), matching the side panel — not the
        // summed quantity, which made one 120-sheet material read as "120 items".
        ctx.fillText(`${materialCount} item${materialCount === 1 ? "" : "s"}`, r.x + r.w / 2, r.y + r.h / 2 + 13);
    }

    ctx.restore();
}

function getPointerPosition(e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
    };
}

export function RoomMap({
    floors = [],
    materials = [],
    onCompartmentClick,
    selectedCompartment,
}: RoomMapProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const cam = useRef(createCamera());
    const hasFittedInitialView = useRef(false);
    const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
    const pinch = useRef<{ dist: number; zoom: number } | null>(null);
    // Screen point the current zoom animation should keep fixed (cursor / pinch
    // midpoint / viewport centre), so zooming moves toward it instead of drifting.
    const zoomAnchor = useRef<Vec2 | null>(null);

    const [cursor, setCursor] = useState("grab");
    const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
    const [selectedAreaId, setSelectedAreaId] = useState<string | null>("tinkering-studio");

    const floor = floors[0] ?? null;
    const selectedArea = floor?.elements.find(el => el.id === selectedAreaId) ?? null;
    const selectedMaterials = getAreaInventory(materials, selectedAreaId ?? undefined);

    useEffect(() => {
        if (selectedCompartment !== undefined) {
            setSelectedAreaId(selectedCompartment);
        }
    }, [selectedCompartment]);

    const hitTest = useCallback((screenX: number, screenY: number) => {
        if (!floor) {
            return undefined;
        }

        const world = screenToWorld(screenX, screenY, cam.current);
        return [...floor.elements].reverse().find(el =>
            world.x >= el.x &&
            world.x <= el.x + el.width &&
            world.y >= el.y &&
            world.y <= el.y + el.height
        );
    }, [floor]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const c = cam.current;

        drawBackground(ctx, width, height);
        drawPlanShell(ctx, c);
        drawShelves(ctx, c);
        drawFurniture(ctx, c);

        if (floor) {
            for (const el of floor.elements) {
                drawElement(
                    ctx,
                    el,
                    c,
                    hoveredAreaId === el.id,
                    selectedAreaId === el.id,
                    getAreaInventory(materials, el.id).length
                );
            }
        }
    }, [floor, hoveredAreaId, materials, selectedAreaId]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            const ctx = canvas.getContext("2d");

            canvas.width = Math.max(1, rect.width * dpr);
            canvas.height = Math.max(1, rect.height * dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (!hasFittedInitialView.current && rect.width > 0 && rect.height > 0) {
                cam.current = fitCameraToMap(rect.width, rect.height);
                hasFittedInitialView.current = true;
            }
            draw();
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(container);

        return () => ro.disconnect();
    }, [draw]);

    useEffect(() => {
        let raf = 0;

        const loop = () => {
            const c = cam.current;
            c.pan.x += c.velocity.x;
            c.pan.y += c.velocity.y;
            c.velocity.x *= 0.82;
            c.velocity.y *= 0.82;

            const prevZoom = c.zoom;
            let nextZoom = prevZoom + (c.targetZoom - prevZoom) * 0.18;
            if (Math.abs(c.targetZoom - nextZoom) < 0.001) {
                nextZoom = c.targetZoom;
            }

            if (nextZoom !== prevZoom && zoomAnchor.current) {
                const anchoredPan = panForZoomAtPoint(c.pan, prevZoom, nextZoom, zoomAnchor.current);
                c.pan.x = anchoredPan.x;
                c.pan.y = anchoredPan.y;
            }
            c.zoom = nextZoom;

            if (nextZoom === c.targetZoom) {
                zoomAnchor.current = null;
            }

            draw();
            raf = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(raf);
    }, [draw]);

    const selectArea = (area: FloorElement | undefined) => {
        if (!area) return;
        setSelectedAreaId(area.id);
        onCompartmentClick?.(area.id);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        drag.current = { x: e.clientX, y: e.clientY, moved: false };
        setCursor("grabbing");
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (drag.current) {
            const dx = e.clientX - drag.current.x;
            const dy = e.clientY - drag.current.y;

            if (Math.abs(dx) + Math.abs(dy) > 2) {
                drag.current.moved = true;
            }

            cam.current.velocity.x = dx;
            cam.current.velocity.y = dy;
            drag.current.x = e.clientX;
            drag.current.y = e.clientY;
            return;
        }

        const pos = getPointerPosition(e, canvas);
        const hit = hitTest(pos.x, pos.y);
        setHoveredAreaId(hit?.id ?? null);
        setCursor(hit ? "pointer" : "grab");
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        const wasDragging = drag.current?.moved;
        drag.current = null;
        setCursor("grab");

        if (!canvas || wasDragging) return;

        const pos = getPointerPosition(e, canvas);
        selectArea(hitTest(pos.x, pos.y));
    };

    const zoomBy = (scale: number, anchor: Vec2) => {
        zoomAnchor.current = anchor;
        cam.current.targetZoom = clampZoom(cam.current.targetZoom * scale, MIN_ZOOM, MAX_ZOOM);
    };

    const viewportCenter = (): Vec2 => {
        const rect = containerRef.current?.getBoundingClientRect();
        return rect ? { x: rect.width / 2, y: rect.height / 2 } : { x: 0, y: 0 };
    };

    // React attaches wheel listeners passively, so preventDefault() there both
    // warns and no-ops. Attach a non-passive native listener instead, and zoom
    // toward the cursor.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const scale = e.deltaY > 0 ? 0.9 : 1.1;
            zoomBy(scale, getPointerPosition(e, canvas));
        };

        canvas.addEventListener("wheel", onWheel, { passive: false });
        return () => canvas.removeEventListener("wheel", onWheel);
    }, []);

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 2) {
            const a = e.touches[0];
            const b = e.touches[1];
            pinch.current = {
                dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
                zoom: cam.current.targetZoom,
            };
            return;
        }

        const touch = e.touches[0];
        if (touch) {
            drag.current = { x: touch.clientX, y: touch.clientY, moved: false };
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 2 && pinch.current) {
            const a = e.touches[0];
            const b = e.touches[1];
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            const canvas = canvasRef.current;
            if (canvas) {
                zoomAnchor.current = getPointerPosition(
                    { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 },
                    canvas,
                );
            }
            cam.current.targetZoom = clampZoom(pinch.current.zoom * (dist / pinch.current.dist), MIN_ZOOM, MAX_ZOOM);
            return;
        }

        const touch = e.touches[0];
        if (touch && drag.current) {
            const dx = touch.clientX - drag.current.x;
            const dy = touch.clientY - drag.current.y;
            drag.current.moved = true;
            cam.current.velocity.x = dx;
            cam.current.velocity.y = dy;
            drag.current.x = touch.clientX;
            drag.current.y = touch.clientY;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        const wasDragging = drag.current?.moved;
        pinch.current = null;
        drag.current = null;

        if (!canvas || wasDragging || e.changedTouches.length === 0) return;

        const touch = e.changedTouches[0];
        const pos = getPointerPosition(touch, canvas);
        selectArea(hitTest(pos.x, pos.y));
    };

    return (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "var(--viventory-bg)" }}>
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    position: "relative",
                    minWidth: 0,
                    height: "100%",
                    cursor,
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        touchAction: "none",
                        display: "block",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                        drag.current = null;
                        setHoveredAreaId(null);
                        setCursor("grab");
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                />

                <div style={zoomControls}>
                    <button onClick={() => zoomBy(1.18, viewportCenter())} style={buttonStyle}>+</button>
                    <button onClick={() => zoomBy(0.84, viewportCenter())} style={buttonStyle}>-</button>
                    <button
                        onClick={() => {
                            const rect = containerRef.current?.getBoundingClientRect();
                            if (!rect) return;
                            zoomAnchor.current = null;
                            cam.current = fitCameraToMap(rect.width, rect.height);
                        }}
                        style={buttonStyle}
                    >
                        Reset
                    </button>
                </div>
            </div>

            <aside style={detailPanel}>
                <div style={{ fontSize: 12, color: "var(--viventory-muted-text)", textTransform: "uppercase" }}>
                    Selected area
                </div>
                <h2 style={{ margin: "6px 0 4px", fontSize: 22, lineHeight: 1.15, color: "var(--viventory-text)" }}>
                    {selectedArea?.name ?? "Select an area"}
                </h2>
                <div style={{ color: "var(--viventory-muted-text)", fontSize: 13 }}>
                    {selectedMaterials.length} material type{selectedMaterials.length === 1 ? "" : "s"} stored here
                </div>

                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedMaterials.length > 0 ? selectedMaterials.map(material => (
                        <div key={material.id} style={materialRow}>
                            <div>
                                <div style={{ fontWeight: 700, color: "var(--viventory-text)" }}>{material.name}</div>
                                <div style={{ color: "var(--viventory-muted-text)", fontSize: 12 }}>{material.description}</div>
                            </div>
                            <div style={quantityPill}>
                                {material.quantity} {material.unit}
                            </div>
                        </div>
                    )) : (
                        <div style={{ color: "var(--viventory-muted-text)", fontSize: 14 }}>
                            No materials are assigned to this area yet.
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}

const zoomControls: React.CSSProperties = {
    position: "absolute",
    right: 12,
    bottom: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
};

const buttonStyle: React.CSSProperties = {
    minWidth: 54,
    height: 34,
    border: "1px solid var(--viventory-border)",
    background: "var(--viventory-surface)",
    color: "var(--viventory-text)",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 700,
};

const detailPanel: React.CSSProperties = {
    width: 320,
    borderLeft: "1px solid var(--viventory-border)",
    background: "var(--viventory-surface)",
    color: "var(--viventory-text)",
    padding: 18,
    boxSizing: "border-box",
    overflowY: "auto",
};

const materialRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid var(--viventory-border)",
};

const quantityPill: React.CSSProperties = {
    flexShrink: 0,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 12,
    fontWeight: 700,
};

export const ROOM_MAP_PLAN_SIZE = {
    width: MAP_BOUNDS.width,
    height: MAP_BOUNDS.height,
};
