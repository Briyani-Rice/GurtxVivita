import {
    useRef,
    useEffect,
    useState,
    useCallback,
} from "react";
import {
    Plus,
    Trash2,
    Layers,
    Edit2,
    Check,
    X,
    MousePointer,
    ChevronRight,
    CheckCircle,
    XCircle,
    Bell,
} from "lucide-react";
import {
    FloorElement,
    FloorData,
    ElementType,
    Material,
    MaterialRequest,
} from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool =
    | "select"
    | "compartment"
    | "outofbounds"
    | "stairs"
    | "lift"
    | "chair"
    | "table"
    | "workplace";

type InteractionMode =
    | {
    kind: "draw";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}
    | {
    kind: "move";
    elId: string;
    startMouseX: number;
    startMouseY: number;
    origX: number;
    origY: number;
    currentX: number;
    currentY: number;
}
    | {
    kind: "resize";
    elId: string;
    handle: ResizeHandle;
    startMouseX: number;
    startMouseY: number;
    origEl: FloorElement;
    currentX: number;
    currentY: number;
};

type ResizeHandle =
    | "nw"
    | "n"
    | "ne"
    | "e"
    | "se"
    | "s"
    | "sw"
    | "w";

interface NameDialogState {
    x: number;
    y: number;
    w: number;
    h: number;
    number: string;
    name: string;
    color: string;
}

type MaterialForm = {
    name: string;
    description: string;
    quantity: string;
    unit: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLE: Record<
    ElementType,
    { bg: string; border: string; text: string }
> = {
    compartment: {
        bg: "#D2E7F3",
        border: "#60A5FA",
        text: "#1E3A8A",
    },
    outofbounds: {
        bg: "#D1D5DB",
        border: "#4B5563",
        text: "#1F2937",
    },
    stairs: { bg: "#F9F4CE", border: "#CA8A04", text: "#78350F" },
    lift: { bg: "#E2CDEC", border: "#A855F7", text: "#6B21A8" },
    chair: { bg: "#F4D4D3", border: "#F87171", text: "#991B1B" },
    table: { bg: "#F9DFBC", border: "#FB923C", text: "#9A3412" },
    workplace: { bg: "#E2CDEC", border: "#A855F7", text: "#6B21A8" },
};

const PLACE_TOOLS: {
    id: Tool;
    label: string;
    emoji: string;
    key: string;
    desc: string;
}[] = [
    {
        id: "compartment",
        label: "Compartment",
        emoji: "📦",
        key: "C",
        desc: "Storage area",
    },
    {
        id: "chair",
        label: "Chair",
        emoji: "🪑",
        key: "H",
        desc: "Seating",
    },
    {
        id: "table",
        label: "Table",
        emoji: "🪑",
        key: "T",
        desc: "Table surface",
    },
    {
        id: "workplace",
        label: "Workplace",
        emoji: "💼",
        key: "W",
        desc: "Work station",
    },
    {
        id: "outofbounds",
        label: "Out of Bounds",
        emoji: "🚫",
        key: "O",
        desc: "Restricted zone",
    },
    {
        id: "stairs",
        label: "Stairs",
        emoji: "🪜",
        key: "S",
        desc: "Staircase",
    },
    {
        id: "lift",
        label: "Lift / Elevator",
        emoji: "🛗",
        key: "L",
        desc: "Lift shaft",
    },
];

const COMPARTMENT_COLORS = [
    "#D2E7F3",
    "#F4D4D3",
    "#F9F4CE",
    "#F9DFBC",
    "#E2CDEC",
];

const HANDLE_HIT = 10;
const NUDGE_STEP = 1;

const HANDLE_CURSOR: Record<ResizeHandle, string> = {
    nw: "nw-resize",
    n: "n-resize",
    ne: "ne-resize",
    e: "e-resize",
    se: "se-resize",
    s: "s-resize",
    sw: "sw-resize",
    w: "w-resize",
};

const EMPTY_FORM: MaterialForm = {
    name: "",
    description: "",
    quantity: "",
    unit: "pcs",
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function elRect(el: FloorElement, W: number, H: number) {
    return {
        x: (el.x / 100) * W,
        y: (el.y / 100) * H,
        w: (el.width / 100) * W,
        h: (el.height / 100) * H,
    };
}

function handlePositions(
    r: ReturnType<typeof elRect>,
): Record<ResizeHandle, [number, number]> {
    return {
        nw: [r.x, r.y],
        n: [r.x + r.w / 2, r.y],
        ne: [r.x + r.w, r.y],
        e: [r.x + r.w, r.y + r.h / 2],
        se: [r.x + r.w, r.y + r.h],
        s: [r.x + r.w / 2, r.y + r.h],
        sw: [r.x, r.y + r.h],
        w: [r.x, r.y + r.h / 2],
    };
}

function hitHandle(
    pos: { x: number; y: number },
    handles: Record<ResizeHandle, [number, number]>,
): ResizeHandle | null {
    for (const [name, [hx, hy]] of Object.entries(handles) as [
        ResizeHandle,
        [number, number],
    ][]) {
        if (
            Math.abs(pos.x - hx) <= HANDLE_HIT &&
            Math.abs(pos.y - hy) <= HANDLE_HIT
        )
            return name;
    }
    return null;
}

function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

function applyResize(
    orig: FloorElement,
    handle: ResizeHandle,
    dxPct: number,
    dyPct: number,
): Partial<FloorElement> {
    const MIN = 3;
    let { x, y, width, height } = orig;
    if (handle.includes("w")) {
        x += dxPct;
        width -= dxPct;
    }
    if (handle.includes("e")) {
        width += dxPct;
    }
    if (handle.includes("n")) {
        y += dyPct;
        height -= dyPct;
    }
    if (handle.includes("s")) {
        height += dyPct;
    }
    if (width < MIN) {
        if (handle.includes("w")) x = orig.x + orig.width - MIN;
        width = MIN;
    }
    if (height < MIN) {
        if (handle.includes("n")) y = orig.y + orig.height - MIN;
        height = MIN;
    }
    return {
        x: clamp(x, 0, 100 - width),
        y: clamp(y, 0, 100 - height),
        width: clamp(width, MIN, 100),
        height: clamp(height, MIN, 100),
    };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FloorPlanEditorProps {
    floors: FloorData[];
    onFloorsChange: (floors: FloorData[]) => void;
    materials: Material[];
    onAddMaterial: (
        data: Omit<Material, "id" | "createdAt">,
    ) => void;
    onEditMaterial: (
        id: string,
        data: Omit<Material, "id" | "createdAt">,
    ) => void;
    onDeleteMaterial: (id: string) => void;
    selectedElement: string | null;
    onElementSelect: (id: string | null) => void;
    requests?: MaterialRequest[];
    onApproveRequest?: (id: string) => void;
    onDeclineRequest?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloorPlanEditor({
                                    floors,
                                    onFloorsChange,
                                    materials,
                                    onAddMaterial,
                                    onEditMaterial,
                                    onDeleteMaterial,
                                    selectedElement,
                                    onElementSelect,
                                    requests = [],
                                    onApproveRequest,
                                    onDeclineRequest,
                                }: FloorPlanEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const drawRef = useRef<() => void>(() => {});
    const ixRef = useRef<InteractionMode | null>(null);
    const addMenuRef = useRef<HTMLDivElement>(null);

    const [currentFloorIdx, setCurrentFloorIdx] = useState(0);
    const [tool, setTool] = useState<Tool>("select");
    const [interaction, setInteraction] =
        useState<InteractionMode | null>(null);
    const [dialog, setDialog] = useState<NameDialogState | null>(
        null,
    );
    const [cursor, setCursor] = useState("default");
    const [addMenuOpen, setAddMenuOpen] = useState(false);

    const [addForm, setAddForm] = useState<MaterialForm | null>(
        null,
    );
    const [editingMaterialId, setEditingMaterialId] = useState<
        string | null
    >(null);
    const [editForm, setEditForm] =
        useState<MaterialForm>(EMPTY_FORM);
    const [editingProps, setEditingProps] = useState<{
        number: string;
        name: string;
        color: string;
    } | null>(null);

    const currentFloor = floors[currentFloorIdx] ?? null;
    const selectedEl =
        currentFloor?.elements.find(
            (e) => e.id === selectedElement,
        ) ?? null;
    const isCompartment = selectedEl?.type === "compartment";
    const compartmentMats = isCompartment
        ? materials.filter(
            (m) => m.compartmentId === selectedElement,
        )
        : [];
    const activePlaceTool =
        tool !== "select"
            ? PLACE_TOOLS.find((t) => t.id === tool)
            : null;

    useEffect(() => {
        ixRef.current = interaction;
    }, [interaction]);

    useEffect(() => {
        if (selectedEl?.type === "compartment") {
            setEditingProps({
                number: selectedEl.number ?? "",
                name: selectedEl.name ?? "",
                color: selectedEl.color ?? COMPARTMENT_COLORS[0],
            });
        } else {
            setEditingProps(null);
        }
        setAddForm(null);
        setEditingMaterialId(null);
    }, [selectedElement]);

    // ── Helpers ────────────────────────────────────────────────────────────────

    const updateElement = useCallback(
        (id: string, patch: Partial<FloorElement>) => {
            onFloorsChange(
                floors.map((f, i) =>
                    i === currentFloorIdx
                        ? {
                            ...f,
                            elements: f.elements.map((e) =>
                                e.id === id ? { ...e, ...patch } : e,
                            ),
                        }
                        : f,
                ),
            );
        },
        [floors, onFloorsChange, currentFloorIdx],
    );

    const deleteSelected = useCallback(() => {
        if (!selectedElement || !currentFloor) return;
        onFloorsChange(
            floors.map((f, i) =>
                i === currentFloorIdx
                    ? {
                        ...f,
                        elements: f.elements.filter(
                            (e) => e.id !== selectedElement,
                        ),
                    }
                    : f,
            ),
        );
        onElementSelect(null);
    }, [
        selectedElement,
        currentFloor,
        floors,
        currentFloorIdx,
        onFloorsChange,
        onElementSelect,
    ]);

    const getPos = useCallback(
        (
            e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent,
        ): { x: number; y: number } => {
            const canvas = canvasRef.current;
            if (!canvas) return { x: 0, y: 0 };
            const rect = canvas.getBoundingClientRect();

            let clientX: number, clientY: number;
            if ('touches' in e && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if ('changedTouches' in e && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else if ('clientX' in e) {
                clientX = e.clientX;
                clientY = e.clientY;
            } else {
                return { x: 0, y: 0 };
            }

            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height),
            };
        },
        [],
    );

    // ── Draw ───────────────────────────────────────────────────────────────────

    useEffect(() => {
        drawRef.current = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const W = canvas.width,
                H = canvas.height;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = "#F9FAFB";
            ctx.fillRect(0, 0, W, H);

            const GRID = 40;
            ctx.strokeStyle = "#E5E7EB";
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += GRID) {
                ctx.beginPath();
                ctx.moveTo(x + 0.5, 0);
                ctx.lineTo(x + 0.5, H);
                ctx.stroke();
            }
            for (let y = 0; y < H; y += GRID) {
                ctx.beginPath();
                ctx.moveTo(0, y + 0.5);
                ctx.lineTo(W, y + 0.5);
                ctx.stroke();
            }

            if (!currentFloor) return;

            const ix = ixRef.current;
            const live = currentFloor.elements.map((el) => {
                if (!ix) return el;
                if (ix.kind === "move" && ix.elId === el.id) {
                    const dxPct =
                        ((ix.currentX - ix.startMouseX) / W) * 100;
                    const dyPct =
                        ((ix.currentY - ix.startMouseY) / H) * 100;
                    return {
                        ...el,
                        x: clamp(ix.origX + dxPct, 0, 100 - el.width),
                        y: clamp(ix.origY + dyPct, 0, 100 - el.height),
                    };
                }
                if (ix.kind === "resize" && ix.elId === el.id) {
                    const dxPct =
                        ((ix.currentX - ix.startMouseX) / W) * 100;
                    const dyPct =
                        ((ix.currentY - ix.startMouseY) / H) * 100;
                    return {
                        ...el,
                        ...applyResize(ix.origEl, ix.handle, dxPct, dyPct),
                    };
                }
                return el;
            });

            const sorted = [
                ...live.filter((e) => e.id !== selectedElement),
                ...live.filter((e) => e.id === selectedElement),
            ];
            for (const el of sorted)
                renderEl(ctx, el, W, H, el.id === selectedElement);

            if (ix?.kind === "draw") {
                const rx = Math.min(ix.startX, ix.currentX),
                    ry = Math.min(ix.startY, ix.currentY);
                const rw = Math.abs(ix.currentX - ix.startX),
                    rh = Math.abs(ix.currentY - ix.startY);
                if (rw > 4 && rh > 4) {
                    const s = STYLE[tool as ElementType];
                    ctx.save();
                    ctx.globalAlpha = 0.45;
                    ctx.fillStyle = s.bg;
                    ctx.fillRect(rx, ry, rw, rh);
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = s.border;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 4]);
                    ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
                    ctx.setLineDash([]);
                    ctx.restore();
                }
            }
        };
        drawRef.current();
    }, [
        currentFloor,
        selectedElement,
        interaction,
        tool,
        materials,
    ]);

    // ── Canvas resize ──────────────────────────────────────────────────────────

    useEffect(() => {
        const container = containerRef.current,
            canvas = canvasRef.current;
        if (!container || !canvas) return;
        const ro = new ResizeObserver(() => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            drawRef.current();
        });
        ro.observe(container);
        return () => ro.disconnect();
    }, []);

    // ── Render one element ─────────────────────────────────────────────────────

    function renderEl(
        ctx: CanvasRenderingContext2D,
        el: FloorElement,
        W: number,
        H: number,
        isSel: boolean,
    ) {
        const r = elRect(el, W, H);
        const { x, y, w, h } = r;
        const s = STYLE[el.type];
        ctx.save();
        if (el.type === "outofbounds") {
            ctx.fillStyle = s.bg;
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = "#9CA3AF";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            for (let i = -(h + w); i < w + h; i += 14) {
                ctx.moveTo(x + i, y);
                ctx.lineTo(x + i + h, y + h);
            }
            ctx.stroke();
        } else if (el.type === "stairs") {
            ctx.fillStyle = s.bg;
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = s.border;
            ctx.lineWidth = 1.5;
            const steps = Math.max(3, Math.round(h / 16)),
                sh = h / steps;
            for (let i = 0; i < steps; i++)
                ctx.strokeRect(
                    x + 2,
                    y + i * sh,
                    w * (1 - i / steps) - 4,
                    sh,
                );
            ctx.fillStyle = s.text;
            ctx.font = `bold ${Math.min(11, w * 0.2)}px system-ui`;
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText("STAIRS", x + w / 2, y + h - 4);
        } else if (el.type === "lift") {
            ctx.fillStyle = s.bg;
            ctx.fillRect(x, y, w, h);
            const fs = Math.min(w * 0.45, h * 0.45, 28);
            ctx.font = `bold ${fs}px system-ui`;
            ctx.fillStyle = s.border;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("⇅", x + w / 2, y + h / 2 - fs * 0.1);
            ctx.font = `bold ${Math.min(10, w * 0.18)}px system-ui`;
            ctx.fillStyle = s.text;
            ctx.textBaseline = "bottom";
            ctx.fillText("LIFT", x + w / 2, y + h - 4);
        } else if (el.type === "chair") {
            ctx.fillStyle = s.bg;
            ctx.fillRect(x, y, w, h);
            const fs = Math.min(w * 0.6, h * 0.6, 32);
            ctx.font = `${fs}px system-ui`;
            ctx.fillStyle = s.text;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🪑", x + w / 2, y + h / 2);
        } else if (el.type === "table") {
            ctx.fillStyle = s.bg;
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = s.border;
            ctx.lineWidth = 2;
            const margin = Math.min(w, h) * 0.15;
            ctx.strokeRect(x + margin, y + margin, w - 2 * margin, h - 2 * margin);
            ctx.font = `bold ${Math.min(w * 0.15, h * 0.15, 10)}px system-ui`;
            ctx.fillStyle = s.text;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("TABLE", x + w / 2, y + h / 2);
        } else if (el.type === "workplace") {
            ctx.fillStyle = s.bg;
            ctx.fillRect(x, y, w, h);
            const fs = Math.min(w * 0.5, h * 0.5, 28);
            ctx.font = `${fs}px system-ui`;
            ctx.fillStyle = s.text;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("💼", x + w / 2, y + h / 2 - fs * 0.15);
            ctx.font = `bold ${Math.min(9, w * 0.15)}px system-ui`;
            ctx.textBaseline = "bottom";
            ctx.fillText("WORK", x + w / 2, y + h - 4);
        } else {
            ctx.fillStyle = el.color ?? s.bg;
            ctx.fillRect(x, y, w, h);
            const count = materials.filter(
                (m) => m.compartmentId === el.id,
            ).length;
            const ns = Math.min(w * 0.38, h * 0.38, 22),
                ts = Math.min(ns * 0.72, 13);
            ctx.fillStyle = s.text;
            ctx.textAlign = "center";
            if (el.number) {
                ctx.font = `bold ${ns}px system-ui`;
                ctx.textBaseline = "middle";
                ctx.fillText(
                    el.number,
                    x + w / 2,
                    y + h / 2 - (el.name ? ns * 0.55 : 0),
                );
            }
            if (el.name) {
                ctx.font = `${ts}px system-ui`;
                ctx.textBaseline = "middle";
                ctx.fillText(
                    el.name.length > 12
                        ? el.name.slice(0, 11) + "…"
                        : el.name,
                    x + w / 2,
                    y + h / 2 + (el.number ? ns * 0.55 : 0),
                );
            }
            if (count > 0 && w > 36 && h > 24) {
                const bx = x + w - 4,
                    by = y + 4,
                    br = Math.min(10, w * 0.18);
                ctx.beginPath();
                ctx.arc(bx - br, by + br, br, 0, Math.PI * 2);
                ctx.fillStyle = "#1D4ED8";
                ctx.fill();
                ctx.font = `bold ${br * 1.1}px system-ui`;
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(String(count), bx - br, by + br);
            }
        }
        ctx.strokeStyle = isSel ? "#F59E0B" : s.border;
        ctx.lineWidth = isSel ? 3 : 2;
        if (isSel) {
            ctx.shadowColor = "#F59E0B";
            ctx.shadowBlur = 8;
        }
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        ctx.shadowBlur = 0;
        if (isSel) {
            const handles = handlePositions(r);
            ctx.fillStyle = "#F59E0B";
            for (const [hx, hy] of Object.values(handles)) {
                ctx.fillRect(hx - 4, hy - 4, 8, 8);
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 1;
                ctx.strokeRect(hx - 4, hy - 4, 8, 8);
            }
        }
        ctx.restore();
    }

    // ── Hit test ───────────────────────────────────────────────────────────────

    const hitTest = (pos: {
        x: number;
        y: number;
    }): FloorElement | undefined => {
        const canvas = canvasRef.current!;
        return [...(currentFloor?.elements ?? [])]
            .reverse()
            .find((el) => {
                const r = elRect(el, canvas.width, canvas.height);
                return (
                    pos.x >= r.x &&
                    pos.x <= r.x + r.w &&
                    pos.y >= r.y &&
                    pos.y <= r.y + r.h
                );
            });
    };

    // ── Mouse ──────────────────────────────────────────────────────────────────

    const onMouseDown = (e: React.MouseEvent) => {
        if (!currentFloor) return;
        const pos = getPos(e);
        const W = canvasRef.current!.width,
            H = canvasRef.current!.height;

        if (tool !== "select") {
            setDialog(null);
            setInteraction({
                kind: "draw",
                startX: pos.x,
                startY: pos.y,
                currentX: pos.x,
                currentY: pos.y,
            });
            return;
        }
        if (selectedEl) {
            const r = elRect(selectedEl, W, H);
            const handle = hitHandle(pos, handlePositions(r));
            if (handle) {
                setInteraction({
                    kind: "resize",
                    elId: selectedEl.id,
                    handle,
                    startMouseX: pos.x,
                    startMouseY: pos.y,
                    origEl: { ...selectedEl },
                    currentX: pos.x,
                    currentY: pos.y,
                });
                return;
            }
        }
        const hit = hitTest(pos);
        if (hit) {
            onElementSelect(hit.id);
            setInteraction({
                kind: "move",
                elId: hit.id,
                startMouseX: pos.x,
                startMouseY: pos.y,
                origX: hit.x,
                origY: hit.y,
                currentX: pos.x,
                currentY: pos.y,
            });
        } else {
            onElementSelect(null);
        }
    };

    const onMouseMove = (e: React.MouseEvent) => {
        const pos = getPos(e);
        const ix = ixRef.current;
        const W = canvasRef.current!.width,
            H = canvasRef.current!.height;
        if (ix) {
            setInteraction({
                ...ix,
                currentX: pos.x,
                currentY: pos.y,
            } as InteractionMode);
            return;
        }
        if (tool !== "select") {
            setCursor("crosshair");
            return;
        }
        if (selectedEl) {
            const r = elRect(selectedEl, W, H);
            const h = hitHandle(pos, handlePositions(r));
            if (h) {
                setCursor(HANDLE_CURSOR[h]);
                return;
            }
        }
        setCursor(hitTest(pos) ? "grab" : "default");
    };

    const onMouseUp = () => {
        const ix = ixRef.current;
        const canvas = canvasRef.current!;
        const W = canvas.width,
            H = canvas.height;
        if (ix?.kind === "draw") {
            const rx = Math.min(ix.startX, ix.currentX),
                ry = Math.min(ix.startY, ix.currentY);
            const rw = Math.abs(ix.currentX - ix.startX),
                rh = Math.abs(ix.currentY - ix.startY);
            setInteraction(null);
            if (rw < 12 || rh < 12) return;
            const pct = (px: number, d: number) => (px / d) * 100;
            if (tool === "compartment") {
                setDialog({
                    x: rx,
                    y: ry,
                    w: rw,
                    h: rh,
                    number: "",
                    name: "",
                    color: COMPARTMENT_COLORS[0],
                });
            } else {
                placeElement({
                    id: crypto.randomUUID(),
                    type: tool as ElementType,
                    x: pct(rx, W),
                    y: pct(ry, H),
                    width: pct(rw, W),
                    height: pct(rh, H),
                });
            }
            return;
        }
        if (ix?.kind === "move") {
            const dxPct = ((ix.currentX - ix.startMouseX) / W) * 100;
            const dyPct = ((ix.currentY - ix.startMouseY) / H) * 100;
            const el = currentFloor?.elements.find(
                (e) => e.id === ix.elId,
            );
            if (el)
                updateElement(ix.elId, {
                    x: clamp(ix.origX + dxPct, 0, 100 - el.width),
                    y: clamp(ix.origY + dyPct, 0, 100 - el.height),
                });
            setInteraction(null);
            setCursor("grab");
            return;
        }
        if (ix?.kind === "resize") {
            const dxPct = ((ix.currentX - ix.startMouseX) / W) * 100;
            const dyPct = ((ix.currentY - ix.startMouseY) / H) * 100;
            updateElement(
                ix.elId,
                applyResize(ix.origEl, ix.handle, dxPct, dyPct),
            );
            setInteraction(null);
            return;
        }
        setInteraction(null);
    };

    // ── Keyboard ───────────────────────────────────────────────────────────────

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;
            switch (e.key) {
                case "v":
                case "V":
                    setTool("select");
                    break;
                case "c":
                case "C":
                    setTool("compartment");
                    break;
                case "h":
                case "H":
                    setTool("chair");
                    break;
                case "t":
                case "T":
                    setTool("table");
                    break;
                case "w":
                case "W":
                    setTool("workplace");
                    break;
                case "o":
                case "O":
                    setTool("outofbounds");
                    break;
                case "s":
                case "S":
                    setTool("stairs");
                    break;
                case "l":
                case "L":
                    setTool("lift");
                    break;
                case "Delete":
                case "Backspace":
                    deleteSelected();
                    break;
                case "Escape":
                    setDialog(null);
                    setAddForm(null);
                    setEditingMaterialId(null);
                    onElementSelect(null);
                    setTool("select");
                    break;
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowUp":
                case "ArrowDown":
                    if (!selectedEl) break;
                    e.preventDefault();
                    const step = e.shiftKey ? NUDGE_STEP * 5 : NUDGE_STEP;
                    const dx =
                        e.key === "ArrowLeft"
                            ? -step
                            : e.key === "ArrowRight"
                                ? step
                                : 0;
                    const dy =
                        e.key === "ArrowUp"
                            ? -step
                            : e.key === "ArrowDown"
                                ? step
                                : 0;
                    updateElement(selectedEl.id, {
                        x: clamp(
                            selectedEl.x + dx,
                            0,
                            100 - selectedEl.width,
                        ),
                        y: clamp(
                            selectedEl.y + dy,
                            0,
                            100 - selectedEl.height,
                        ),
                    });
                    break;
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [
        selectedEl,
        deleteSelected,
        updateElement,
        onElementSelect,
    ]);

    // ── Element / Floor CRUD ───────────────────────────────────────────────────

    const placeElement = (el: FloorElement) => {
        onFloorsChange(
            floors.map((f, i) =>
                i === currentFloorIdx
                    ? { ...f, elements: [...f.elements, el] }
                    : f,
            ),
        );
    };

    const confirmCompartment = () => {
        if (!dialog) return;
        const W = canvasRef.current!.width,
            H = canvasRef.current!.height;
        const pct = (px: number, d: number) => (px / d) * 100;
        placeElement({
            id: crypto.randomUUID(),
            type: "compartment",
            x: pct(dialog.x, W),
            y: pct(dialog.y, H),
            width: pct(dialog.w, W),
            height: pct(dialog.h, H),
            number: dialog.number.trim(),
            name: dialog.name.trim(),
            color: dialog.color,
        });
        setDialog(null);
    };

    const saveProps = () => {
        if (!selectedElement || !editingProps) return;
        updateElement(selectedElement, {
            number: editingProps.number.trim(),
            name: editingProps.name.trim(),
            color: editingProps.color,
        });
    };

    const addFloor = () => {
        const f: FloorData = {
            id: crypto.randomUUID(),
            name: `Floor ${floors.length + 1}`,
            elements: [],
        };
        onFloorsChange([...floors, f]);
        setCurrentFloorIdx(floors.length);
        onElementSelect(null);
    };

    const deleteCurrentFloor = () => {
        if (floors.length <= 1) return;
        const updated = floors.filter(
            (_, i) => i !== currentFloorIdx,
        );
        onFloorsChange(updated);
        setCurrentFloorIdx(
            Math.min(currentFloorIdx, updated.length - 1),
        );
        onElementSelect(null);
    };

    const handleConfirmAdd = () => {
        if (!addForm || !selectedElement || !addForm.name.trim())
            return;
        onAddMaterial({
            name: addForm.name.trim(),
            description: addForm.description.trim(),
            quantity: Number(addForm.quantity) || 0,
            unit: addForm.unit.trim() || "pcs",
            compartmentId: selectedElement,
        });
        setAddForm(null);
    };

    const handleStartEdit = (m: Material) => {
        setEditingMaterialId(m.id);
        setEditForm({
            name: m.name,
            description: m.description,
            quantity: String(m.quantity),
            unit: m.unit,
        });
        setAddForm(null);
    };

    const handleConfirmEdit = () => {
        if (
            !editingMaterialId ||
            !editForm.name.trim() ||
            !selectedElement
        )
            return;
        onEditMaterial(editingMaterialId, {
            name: editForm.name.trim(),
            description: editForm.description.trim(),
            quantity: Number(editForm.quantity) || 0,
            unit: editForm.unit.trim() || "pcs",
            compartmentId: selectedElement,
        });
        setEditingMaterialId(null);
    };

    // ─────────────────────────────────────────────────────────────────────────────

    return (
        <div
            className="flex overflow-hidden bg-white"
            style={{ height: "100%" }}
        >
            {/* ═══ LEFT SIDEBAR ═══ */}
            <div className="w-44 sm:w-52 shrink-0 flex flex-col bg-gray-50 border-r border-gray-200 overflow-y-auto hidden md:flex">
                {/* ── Top tools ── */}
                <div className="p-3 border-b border-gray-200 space-y-2">
                    {/* Select button */}
                    <button
                        onClick={() => setTool("select")}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            tool === "select"
                                ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                        <MousePointer className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left text-xs">
              Select
            </span>
                        <kbd className="text-[10px] bg-white/20 border border-white/30 rounded px-1 font-mono opacity-70">
                            V
                        </kbd>
                    </button>

                    {/* Add button with hover dropdown */}
                    <div
                        ref={addMenuRef}
                        className="relative"
                        onMouseEnter={() => setAddMenuOpen(true)}
                        onMouseLeave={() => setAddMenuOpen(false)}
                    >
                        <button
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                activePlaceTool
                                    ? "border-blue-500 shadow-sm"
                                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                            style={
                                activePlaceTool
                                    ? {
                                        background: STYLE[activePlaceTool.id as ElementType].bg + "cc",
                                        borderColor: STYLE[activePlaceTool.id as ElementType].border,
                                        color: STYLE[activePlaceTool.id as ElementType].text,
                                    }
                                    : {}
                            }
                        >
    <span className="text-base leading-none">
      {activePlaceTool ? activePlaceTool.emoji : <Plus className="w-4 h-4" />}
    </span>
                            <span className="flex-1 text-left text-xs">
      {activePlaceTool ? activePlaceTool.label : "Add element"}
    </span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                        </button>

                        {addMenuOpen && (
                            <div
                                className="absolute z-50 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 w-52 overflow-hidden"
                                style={{
                                    minWidth: 210,
                                    top:
                                        addMenuRef.current &&
                                        addMenuRef.current.getBoundingClientRect().top < 260
                                            ? "100%"
                                            : "auto",
                                    bottom:
                                        addMenuRef.current &&
                                        addMenuRef.current.getBoundingClientRect().top >= 260
                                            ? "100%"
                                            : "auto",
                                    left: 0,
                                    right:
                                        addMenuRef.current &&
                                        addMenuRef.current.getBoundingClientRect().right > window.innerWidth
                                            ? 0
                                            : "auto",
                                    marginTop:
                                        addMenuRef.current &&
                                        addMenuRef.current.getBoundingClientRect().top < 260
                                            ? 8
                                            : 0,
                                    marginBottom:
                                        addMenuRef.current &&
                                        addMenuRef.current.getBoundingClientRect().top >= 260
                                            ? 8
                                            : 0,
                                }}
                            >
                                <div
                                    className="absolute w-3 h-3 bg-white border-l border-b border-gray-200 rotate-45"
                                    style={{
                                        left: -6,
                                        top:
                                            addMenuRef.current &&
                                            addMenuRef.current.getBoundingClientRect().top < 260
                                                ? 12
                                                : "auto",
                                        bottom:
                                            addMenuRef.current &&
                                            addMenuRef.current.getBoundingClientRect().top >= 260
                                                ? 12
                                                : "auto",
                                    }}
                                />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pb-1 pt-0.5">
                                    Draw an element
                                </p>

                                {PLACE_TOOLS.map((t) => {
                                    const s = STYLE[t.id as ElementType];
                                    const isActive = tool === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                setTool(t.id);
                                                setAddMenuOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-all ${
                                                isActive ? "bg-blue-50" : "hover:bg-gray-50"
                                            }`}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-md border-2 flex items-center justify-center text-sm shrink-0"
                                                style={{
                                                    backgroundColor: s.bg,
                                                    borderColor: s.border,
                                                }}
                                            >
                                                {t.emoji}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-gray-800">{t.label}</div>
                                                <div className="text-[10px] text-gray-400">{t.desc}</div>
                                            </div>
                                            <kbd className="text-[10px] bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-500 shrink-0">
                                                {t.key}
                                            </kbd>
                                        </button>
                                    );
                                })}

                                <div className="mx-3 my-1.5 border-t border-gray-100" />
                                <p className="text-[10px] text-gray-400 px-3 pb-1">
                                    After selecting, drag on the canvas to draw
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Active tool hint */}
                    {activePlaceTool && (
                        <div
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                            style={{
                                background:
                                    STYLE[activePlaceTool.id as ElementType].bg +
                                    "55",
                                color:
                                STYLE[activePlaceTool.id as ElementType].text,
                            }}
                        >
                            <span>{activePlaceTool.emoji}</span>
                            <span>Drag on canvas to draw</span>
                            <button
                                onClick={() => setTool("select")}
                                className="ml-auto opacity-60 hover:opacity-100"
                                title="Cancel (Esc)"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Shortcuts ── */}
                <div className="p-3 border-b border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Shortcuts
                    </p>
                    <div className="space-y-1 text-[11px] text-gray-500">
                        {[
                            ["Del / ⌫", "Delete selected"],
                            ["Esc", "Deselect / cancel"],
                            ["↑↓←→", "Nudge 1%"],
                            ["⇧+↑↓←→", "Nudge 5%"],
                        ].map(([k, v]) => (
                            <div
                                key={k}
                                className="flex items-center justify-between gap-2"
                            >
                                <kbd className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px] shrink-0">
                                    {k}
                                </kbd>
                                <span className="text-right leading-tight text-gray-400">
                  {v}
                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Selected element ── */}
                <div className="p-3 border-b border-gray-200">
                    {selectedEl ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 capitalize">
                  {selectedEl.type === "outofbounds"
                      ? "Out of Bounds"
                      : selectedEl.type}
                </span>
                                <button
                                    onClick={deleteSelected}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" /> Del
                                </button>
                            </div>
                            {selectedEl.type === "compartment" &&
                                editingProps && (
                                    <div className="space-y-1.5">
                                        <div>
                                            <label className="block text-[10px] text-gray-400 mb-0.5">
                                                Number
                                            </label>
                                            <input
                                                value={editingProps.number}
                                                onChange={(e) =>{
                                                    saveProps()
                                                    setEditingProps((p) =>
                                                        p
                                                            ? { ...p, number: e.target.value }
                                                            : null,
                                                    )
                                                }
                                                }
                                                placeholder="e.g. 1A"
                                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-400 mb-0.5">
                                                Name
                                            </label>
                                            <input
                                                value={editingProps.name}
                                                onChange={(e) =>{
                                                    saveProps()
                                                    setEditingProps((p) =>
                                                        p
                                                            ? { ...p, name: e.target.value }
                                                            : null,
                                                    )
                                                }
                                                }
                                                placeholder="e.g. Storage A"
                                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-400 mb-0.5">
                                                Color
                                            </label>
                                            <div className="flex gap-1 flex-wrap">
                                                {COMPARTMENT_COLORS.map((c) => (
                                                    <button
                                                        key={c}
                                                        onClick={() =>{
                                                            saveProps();
                                                            setEditingProps((p) =>
                                                                p ? { ...p, color: c } : null,
                                                            )
                                                        }
                                                        }
                                                        className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${editingProps.color === c ? "border-gray-700 scale-110" : "border-transparent"}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            {selectedEl.type !== "compartment" && (
                                <p className="text-xs text-gray-400">
                                    Drag to move · Handles to resize
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 text-center py-1">
                            Nothing selected
                        </p>
                    )}
                </div>

                {/* ── Floors ── */}
                <div className="flex-1 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Floors
                        </p>
                        <button
                            onClick={addFloor}
                            className="p-1 rounded hover:bg-gray-200 text-gray-500"
                            title="Add floor"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {floors.map((f, i) => (
                            <button
                                key={f.id}
                                onClick={() => {
                                    setCurrentFloorIdx(i);
                                    onElementSelect(null);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                    i === currentFloorIdx
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                                }`}
                            >
                                {f.name}
                                <span className="ml-1 opacity-60 font-normal">
                  ({f.elements.length})
                </span>
                            </button>
                        ))}
                    </div>
                    {floors.length > 1 && (
                        <button
                            onClick={deleteCurrentFloor}
                            className="mt-2 w-full text-[11px] text-red-400 hover:text-red-600 hover:bg-red-50 py-1 rounded-lg transition-colors"
                        >
                            Remove this floor
                        </button>
                    )}
                </div>

                {/* ── Legend ── */}
                <div className="p-3 border-t border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Legend
                    </p>
                    <div className="space-y-1">
                        {(
                            Object.entries(STYLE) as [
                                ElementType,
                                (typeof STYLE)[ElementType],
                            ][]
                        ).map(([type, s]) => (
                            <div
                                key={type}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className="w-3.5 h-3.5 rounded-sm border flex-shrink-0"
                                    style={{
                                        backgroundColor: s.bg,
                                        borderColor: s.border,
                                    }}
                                />
                                <span className="text-[11px] text-gray-600 capitalize">
                  {type === "outofbounds"
                      ? "Out of Bounds"
                      : type.charAt(0).toUpperCase() +
                      type.slice(1)}
                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ CANVAS ═══ */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-9 bg-white border-b border-gray-200 flex items-center px-4 gap-2 shrink-0">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
            {currentFloor?.name ?? "—"}
          </span>
                    <span className="ml-auto text-xs text-gray-400">
            {tool === "select"
                ? selectedEl
                    ? "Drag to move · Handles to resize · Arrow keys to nudge"
                    : "Click to select"
                : `Drag to place ${tool === "outofbounds" ? "out-of-bounds zone" : tool}`}
          </span>
                </div>

                <div
                    ref={containerRef}
                    className="relative flex-1"
                    style={{ cursor }}
                >
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 touch-none"
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={() => {
                            setInteraction(null);
                            setCursor("default");
                        }}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            onMouseDown(e as unknown as React.MouseEvent);
                        }}
                        onTouchMove={(e) => {
                            e.preventDefault();
                            onMouseMove(e as unknown as React.MouseEvent);
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            onMouseUp();
                        }}
                    />

                    {currentFloor?.elements.length === 0 &&
                        !interaction && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center text-gray-400">
                                    <div className="text-4xl mb-3">🏗️</div>
                                    <p className="font-medium text-gray-500">
                                        Empty floor
                                    </p>
                                    <p className="text-sm mt-1">
                                        Use the <strong>Add element</strong> button,
                                        then drag to draw
                                    </p>
                                </div>
                            </div>
                        )}

                    {dialog &&
                        (() => {
                            const cw =
                                    containerRef.current?.clientWidth ?? 600,
                                dw = 240;
                            const left = Math.min(
                                dialog.x + dialog.w + 10,
                                cw - dw - 8,
                            );
                            return (
                                <div
                                    className="absolute z-30 bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
                                    style={{ left, top: dialog.y, width: dw }}
                                >
                                    <p className="font-semibold text-gray-800 text-sm mb-3">
                                        New Compartment
                                    </p>
                                    <label className="block text-xs text-gray-500 mb-1">
                                        Number
                                    </label>
                                    <input
                                        autoFocus
                                        placeholder="e.g. 1A"
                                        value={dialog.number}
                                        onChange={(e) =>
                                            setDialog((d) =>
                                                d
                                                    ? { ...d, number: e.target.value }
                                                    : null,
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <label className="block text-xs text-gray-500 mb-1">
                                        Name
                                    </label>
                                    <input
                                        placeholder="e.g. Storage A"
                                        value={dialog.name}
                                        onChange={(e) =>
                                            setDialog((d) =>
                                                d
                                                    ? { ...d, name: e.target.value }
                                                    : null,
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                                confirmCompartment();
                                            if (e.key === "Escape") setDialog(null);
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <label className="block text-xs text-gray-500 mb-1">
                                        Color
                                    </label>
                                    <div className="flex gap-1.5 flex-wrap mb-3">
                                        {COMPARTMENT_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() =>
                                                    setDialog((d) =>
                                                        d ? { ...d, color: c } : null,
                                                    )
                                                }
                                                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${dialog.color === c ? "border-gray-700 scale-110" : "border-transparent"}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={confirmCompartment}
                                            disabled={!dialog.number && !dialog.name}
                                            className="flex-1 bg-blue-600 text-white rounded-lg py-1.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => setDialog(null)}
                                            className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-1.5 text-sm font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                </div>
            </div>

            {/* ═══ RIGHT SIDEBAR — Materials ═══ */}
            <div className="w-48 sm:w-56 shrink-0 flex flex-col bg-gray-50 border-l border-gray-200 overflow-hidden hidden md:flex">
                <div className="p-3 border-b border-gray-200 shrink-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Materials
                    </p>
                    {isCompartment && selectedEl && (
                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                            {selectedEl.number
                                ? `#${selectedEl.number} `
                                : ""}
                            {selectedEl.name}
                        </p>
                    )}
                </div>
                <div>
                    {!isCompartment ? (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <p className="text-xs text-gray-400 text-center">
                                {selectedEl
                                    ? "Select a compartment to manage materials"
                                    : "Click a compartment on the map"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {compartmentMats.length === 0 && !addForm && (
                                    <p className="text-xs text-gray-400 text-center py-4">
                                        No materials yet
                                    </p>
                                )}
                                {compartmentMats.map((m) => (
                                    <div
                                        key={m.id}
                                        className="bg-white rounded-lg border border-gray-200 p-2 text-xs"
                                    >
                                        {editingMaterialId === m.id ? (
                                            <div className="space-y-1">
                                                <input
                                                    autoFocus
                                                    value={editForm.name}
                                                    onChange={(e) =>
                                                        setEditForm((f) => ({
                                                            ...f,
                                                            name: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Name"
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                />
                                                <input
                                                    value={editForm.description}
                                                    onChange={(e) =>
                                                        setEditForm((f) => ({
                                                            ...f,
                                                            description: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Description"
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                />
                                                <div className="flex gap-1">
                                                    <input
                                                        type="number"
                                                        value={editForm.quantity}
                                                        onChange={(e) =>
                                                            setEditForm((f) => ({
                                                                ...f,
                                                                quantity: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Qty"
                                                        className="w-1/2 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    />
                                                    <input
                                                        value={editForm.unit}
                                                        onChange={(e) =>
                                                            setEditForm((f) => ({
                                                                ...f,
                                                                unit: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Unit"
                                                        className="w-1/2 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    />
                                                </div>
                                                <div className="flex gap-1 pt-0.5">
                                                    <button
                                                        onClick={handleConfirmEdit}
                                                        disabled={!editForm.name.trim()}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-40 transition-colors"
                                                    >
                                                        <Check className="w-3 h-3" /> Save
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setEditingMaterialId(null)
                                                        }
                                                        className="flex-1 flex items-center justify-center gap-1 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" /> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="font-semibold text-gray-800 truncate">
                                                    {m.name}
                                                </div>
                                                {m.description && (
                                                    <div className="text-gray-500 truncate mt-0.5">
                                                        {m.description}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mt-1">
                        <span className="font-medium text-gray-700">
                          {m.quantity} {m.unit}
                        </span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleStartEdit(m)}
                                                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (
                                                                    confirm(`Delete "${m.name}"?`)
                                                                )
                                                                    onDeleteMaterial(m.id);
                                                            }}
                                                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {addForm && (
                                    <div className="bg-white rounded-lg border border-blue-200 p-2 space-y-1">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                                            New Material
                                        </p>
                                        <input
                                            autoFocus
                                            value={addForm.name}
                                            onChange={(e) =>
                                                setAddForm((f) =>
                                                    f
                                                        ? { ...f, name: e.target.value }
                                                        : null,
                                                )
                                            }
                                            placeholder="Name *"
                                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        />
                                        <input
                                            value={addForm.description}
                                            onChange={(e) =>
                                                setAddForm((f) =>
                                                    f
                                                        ? {
                                                            ...f,
                                                            description: e.target.value,
                                                        }
                                                        : null,
                                                )
                                            }
                                            placeholder="Description"
                                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        />
                                        <div className="flex gap-1">
                                            <input
                                                type="number"
                                                value={addForm.quantity}
                                                onChange={(e) =>
                                                    setAddForm((f) =>
                                                        f
                                                            ? { ...f, quantity: e.target.value }
                                                            : null,
                                                    )
                                                }
                                                placeholder="Qty"
                                                className="w-1/2 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            />
                                            <input
                                                value={addForm.unit}
                                                onChange={(e) =>
                                                    setAddForm((f) =>
                                                        f
                                                            ? { ...f, unit: e.target.value }
                                                            : null,
                                                    )
                                                }
                                                placeholder="Unit"
                                                className="w-1/2 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            />
                                        </div>
                                        <div className="flex gap-1 pt-0.5">
                                            <button
                                                onClick={handleConfirmAdd}
                                                disabled={!addForm.name.trim()}
                                                className="flex-1 flex items-center justify-center gap-1 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-40 transition-colors"
                                            >
                                                <Check className="w-3 h-3" /> Add
                                            </button>
                                            <button
                                                onClick={() => setAddForm(null)}
                                                className="flex-1 flex items-center justify-center gap-1 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition-colors"
                                            >
                                                <X className="w-3 h-3" /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!addForm && (
                                <div className="p-3 border-t border-gray-200 shrink-0">
                                    <button
                                        onClick={() => {
                                            setAddForm(EMPTY_FORM);
                                            setEditingMaterialId(null);
                                        }}
                                        className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Material
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ═══ RIGHT SIDEBAR — Requests (admin, when no compartment selected) ═══ */}
                {onApproveRequest &&
                    onDeclineRequest &&
                    (() => {
                        const pending = requests.filter(
                            (r) => r.status === "pending",
                        );
                        return (
                            <div className="w-48 sm:w-56 shrink-0 flex flex-col bg-gray-50 border-l border-gray-200 overflow-hidden hidden md:flex">
                                <div className="p-3 border-b border-gray-200 shrink-0 flex items-center gap-2">
                                    <Bell className="w-3.5 h-3.5 text-gray-400" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Requests
                                    </p>
                                    {pending.length > 0 && (
                                        <span className="ml-auto px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                    {pending.length}
                  </span>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    {pending.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-6">
                                            No pending requests
                                        </p>
                                    ) : (
                                        pending.map((req) => (
                                            <div
                                                key={req.id}
                                                className="bg-white rounded-lg border border-gray-200 p-2.5 text-xs space-y-1.5"
                                            >
                                                <div className="font-semibold text-gray-800 truncate">
                                                    {req.materialName}
                                                </div>
                                                <div className="text-gray-500">
                                                    Qty:{" "}
                                                    <span className="font-medium text-gray-700">
                          {req.requestedQuantity}
                        </span>
                                                </div>
                                                {req.reason && (
                                                    <div className="text-gray-400 line-clamp-2">
                                                        {req.reason}
                                                    </div>
                                                )}
                                                <div className="flex gap-1 pt-0.5">
                                                    <button
                                                        onClick={() =>
                                                            onApproveRequest(req.id)
                                                        }
                                                        className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-green-50 border border-green-200 text-green-700 text-[10px] font-medium hover:bg-green-100 transition-colors"
                                                    >
                                                        <CheckCircle className="w-3 h-3" /> OK
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            onDeclineRequest(req.id)
                                                        }
                                                        className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-red-50 border border-red-200 text-red-600 text-[10px] font-medium hover:bg-red-100 transition-colors"
                                                    >
                                                        <XCircle className="w-3 h-3" /> No
                                                    </button>
                                                </div>
                                                <div className="text-[10px] text-gray-300">
                                                    {new Date(
                                                        req.createdAt,
                                                    ).toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })()}
            </div>
        </div>
    );
}
