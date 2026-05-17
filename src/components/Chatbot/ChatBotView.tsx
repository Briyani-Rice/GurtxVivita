import { useState, useRef, useEffect, useCallback } from "react";
import {
    X, Send, Bot, Loader2, MessageSquare,
    Trash2, ChevronDown, Check, ShieldCheck, Zap,
} from "lucide-react";
import { Material, FloorData, FloorElement } from "../../types";
// @ts-ignore
import { GROQ_API_KEY } from "../../Secrets";
// @ts-ignore
import guidelinesRaw from "./ChatBotGuidelines.md?raw";

// ─── Admin action secret ───────────────────────────────────────────────────────
const ADMIN_KEY_NAME = "key12345678901234567890";
const ADMIN_KEY_VAL  = "requestrTmjzhAomgNNseHrWlo2S3CyNtbJr2vT";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    time: string;
    actions?: ActionResult[]; // executed admin actions
}

interface ActionResult {
    type: string;
    label: string;
    ok: boolean;
}

interface ChatBotViewProps {
    materials: Material[];
    floors?: FloorData[];
    // Admin-only props — omit for regular users
    isAdmin?: boolean;
    onAddMaterial?: (data: Omit<Material, "id" | "createdAt">) => void;
    onEditMaterial?: (id: string, data: Omit<Material, "id" | "createdAt">) => void;
    onDeleteMaterial?: (id: string) => void;
}

// ─── Models ───────────────────────────────────────────────────────────────────

const MODELS = [
    { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B",  note: "Fast · Recommended" },
    { id: "gemma2-9b-it",            label: "Gemma 2 9B",    note: "Balanced"            },
    { id: "llama3-8b-8192",          label: "Llama 3 8B",    note: "Reliable"            },
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", note: "Powerful · Slower"  },
];

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
    headerBg:   "#FFF3E0", headerBdr:  "#FFD9A0",
    windowBg:   "#FFFDF7", surface:    "#FFF8ED",
    modelBar:   "#FFF9F0", inputBg:    "#FFFDF7",
    userBubble: "#FFE4B0", userBdr:    "#FFC96B", userText:   "#7A4800",
    asstBubble: "#E8F6FF", asstBdr:    "#B8DDF5", asstText:   "#1A3A50",
    sysBubble:  "#F0FFF4", sysBdr:     "#86EFAC", sysText:    "#166534",
    adminBg:    "#FFF7ED", adminBdr:   "#FED7AA", adminTxt:   "#9A3412",
    avatarBg:   "#FFF0CC", avatarIcon: "#E07B00",
    dotColor:   "#C9A05A",
    sendActive: "#FFB347", sendHover:  "#FFA020", sendIcon:   "#7A4200",
    freeBadgeBg:"#E8F6FF", freeBadgeTxt:"#1A6090",
    chipBg:     "#FFF3E0", chipBdr:    "#FFCC80", chipTxt:    "#A05000",
    border:     "#F0DEC0", borderFocus:"#FFB347",
    text:       "#2D1F0A", muted:      "#8A7055", hint:       "#B8996A",
    errorBg:    "#FFF0F0", errorBdr:   "#FFBBBB", errorTxt:   "#A83232",
    checkColor: "#C07000", selectedBg: "#FFF3E0",
} as const;

const SPIN: React.CSSProperties = { animation: "vvchat-spin 0.9s linear infinite" };

const CHIP_SUGGESTIONS = [
    "What materials are available?",
    "Where are the safety gloves?",
    "How do I request a material?",
];

const ADMIN_CHIP_SUGGESTIONS = [
    "Add 10 screws to Storage A",
    "Delete the paint cans",
    "Update wood planks quantity to 20",
    "What's low in stock?",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
    return typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}
function timeStr() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── System prompt ────────────────────────────────────────────────────────────

const ADMIN_SYSTEM_ADDENDUM = `

## ADMIN MODE — Direct Material Management

You have admin privileges. When the user asks you to add, edit, or delete materials, respond naturally AND include a JSON action block in your reply.

The JSON block format (must be exact):
\`\`\`json
{
  "${ADMIN_KEY_NAME}": "${ADMIN_KEY_VAL}",
  "request": [
    {
      "requestType": "add material",
      "content": {
        "name": "Material Name",
        "quantity": "10",
        "unit": "pcs",
        "description": "Optional description",
        "compartmentId": "exact-compartment-id"
      }
    }
  ]
}
\`\`\`

Supported requestTypes:
- "add material"    — content needs: name, quantity, unit, description, compartmentId
- "edit material"   — content needs: id OR name (to find it) + fields to update
- "delete material" — content needs: id OR name (to find it)

Rules:
- ALWAYS use exact compartment IDs from the materials list above.
- You may include multiple requests in the array.
- If compartmentId is unknown, ask the user to clarify which compartment.
- NEVER invent IDs. Use only IDs shown in the current materials list.
- The JSON block will be hidden from users — only plain language text is shown.
`;

function buildSystemPrompt(
    materials: Material[],
    floors: FloorData[],
    isAdmin: boolean,
): string {
    const compMap = new Map<string, string>();
    floors.forEach(floor => {
        floor.elements
            .filter((e): e is FloorElement & { number: string; name: string } =>
                e.type === "compartment" && !!e.number
            )
            .forEach(e => compMap.set(e.id, `${e.number} · ${e.name} (${floor.name})`));
    });

    const lines = materials.length
        ? materials.map(m => {
            const loc   = compMap.get(m.compartmentId) ?? `Compartment ID: ${m.compartmentId}`;
            const stock = m.quantity <= 0 ? "OUT OF STOCK" : `${m.quantity} ${m.unit} available`;
            return `• [ID: ${m.id}] ${m.name}${m.description ? ` — ${m.description}` : ""} | ${stock} | Location: ${loc} | compartmentId: ${m.compartmentId}`;
        }).join("\n")
        : "No materials are currently registered in the system.";

    // Include compartment IDs so the AI can reference them
    const compLines = [...compMap.entries()]
        .map(([id, label]) => `• [compartmentId: ${id}] ${label}`)
        .join("\n");

    let prompt = `${guidelinesRaw}\n\n## Current materials:\n${lines}`;
    if (compLines) prompt += `\n\n## Compartments available:\n${compLines}`;
    if (isAdmin) prompt += ADMIN_SYSTEM_ADDENDUM;
    return prompt;
}

// ─── Admin action parser ───────────────────────────────────────────────────────

interface AdminRequest {
    requestType: string;
    content: Record<string, string>;
}

function extractAdminBlock(text: string): AdminRequest[] | null {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (!match) return null;
    try {
        const obj = JSON.parse(match[1].trim());
        if (obj[ADMIN_KEY_NAME] !== ADMIN_KEY_VAL) return null;
        if (!Array.isArray(obj.request)) return null;
        return obj.request as AdminRequest[];
    } catch {
        return null;
    }
}

function stripJsonBlocks(text: string): string {
    return text.replace(/```(?:json)?[\s\S]*?```/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function executeAdminActions(
    actions: AdminRequest[],
    materials: Material[],
    onAddMaterial?: ChatBotViewProps["onAddMaterial"],
    onEditMaterial?: ChatBotViewProps["onEditMaterial"],
    onDeleteMaterial?: ChatBotViewProps["onDeleteMaterial"],
): ActionResult[] {
    const results: ActionResult[] = [];

    for (const action of actions) {
        const c = action.content ?? {};
        const type = action.requestType?.toLowerCase().trim();

        if (type === "add material") {
            if (!onAddMaterial) { results.push({ type, label: "Add skipped (no handler)", ok: false }); continue; }
            if (!c.name) { results.push({ type, label: "Add failed: name required", ok: false }); continue; }
            onAddMaterial({
                name:          c.name || "Unnamed",
                description:   c.description || "",
                quantity:      Number(c.quantity) || 0,
                unit:          c.unit || "pcs",
                compartmentId: c.compartmentId || "",
            });
            results.push({ type, label: `Added "${c.name}"`, ok: true });

        } else if (type === "edit material") {
            if (!onEditMaterial) { results.push({ type, label: "Edit skipped (no handler)", ok: false }); continue; }
            const mat = materials.find(m => m.id === c.id || m.name?.toLowerCase() === c.name?.toLowerCase());
            if (!mat) { results.push({ type, label: `Edit failed: "${c.name || c.id}" not found`, ok: false }); continue; }
            onEditMaterial(mat.id, {
                name:          c.name          || mat.name,
                description:   c.description   ?? mat.description,
                quantity:      c.quantity != null ? Number(c.quantity) : mat.quantity,
                unit:          c.unit           || mat.unit,
                compartmentId: c.compartmentId  || mat.compartmentId,
            });
            results.push({ type, label: `Updated "${mat.name}"`, ok: true });

        } else if (type === "delete material") {
            if (!onDeleteMaterial) { results.push({ type, label: "Delete skipped (no handler)", ok: false }); continue; }
            const mat = materials.find(m => m.id === c.id || m.name?.toLowerCase() === c.name?.toLowerCase());
            if (!mat) { results.push({ type, label: `Delete failed: "${c.name || c.id}" not found`, ok: false }); continue; }
            onDeleteMaterial(mat.id);
            results.push({ type, label: `Deleted "${mat.name}"`, ok: true });

        } else {
            results.push({ type: type || "unknown", label: `Unknown action type: "${action.requestType}"`, ok: false });
        }
    }

    return results;
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
    const lines = text.split("\n");
    const nodes: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: "ul" | "ol" | null = null;
    let key = 0;

    const flushList = () => {
        if (!listItems.length) return;
        const Tag = listType === "ol" ? "ol" : "ul";
        nodes.push(
            <Tag key={key++} style={{ margin: "6px 0 6px 18px", padding: 0, lineHeight: 1.7 }}>
                {listItems.map((item, i) => <li key={i} style={{ marginBottom: 2 }}>{inlineMd(item)}</li>)}
            </Tag>
        );
        listItems = []; listType = null;
    };

    for (const line of lines) {
        const h1 = line.match(/^#\s+(.*)/), h2 = line.match(/^##\s+(.*)/), h3 = line.match(/^###\s+(.*)/);
        if (h1 || h2 || h3) {
            flushList();
            const content = (h3 || h2 || h1)![1];
            const size = h1 ? 16 : h2 ? 15 : 14;
            nodes.push(<div key={key++} style={{ fontWeight: 700, fontSize: size, color: C.userText, margin: "10px 0 4px" }}>{inlineMd(content)}</div>);
            continue;
        }
        const ul = line.match(/^[\-\*•]\s+(.*)/);
        if (ul) { if (listType === "ol") flushList(); listType = "ul"; listItems.push(ul[1]); continue; }
        const ol = line.match(/^\d+\.\s+(.*)/);
        if (ol) { if (listType === "ul") flushList(); listType = "ol"; listItems.push(ol[1]); continue; }
        flushList();
        if (line.trim() === "") { nodes.push(<div key={key++} style={{ height: 5 }} />); continue; }
        if (/^---+$/.test(line.trim())) { nodes.push(<hr key={key++} style={{ border: "none", borderTop: `1px solid ${C.asstBdr}`, margin: "8px 0" }} />); continue; }
        nodes.push(<div key={key++} style={{ lineHeight: 1.65, marginBottom: 1 }}>{inlineMd(line)}</div>);
    }
    flushList();
    return <>{nodes}</>;
}

function inlineMd(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
    let last = 0, key = 0, m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        if (m[2]) parts.push(<strong key={key++} style={{ fontWeight: 700 }}>{m[2]}</strong>);
        else if (m[3]) parts.push(<em key={key++}>{m[3]}</em>);
        else if (m[4]) parts.push(<code key={key++} style={{ fontFamily: "monospace", fontSize: "0.88em", background: "rgba(0,0,0,0.07)", borderRadius: 4, padding: "1px 5px" }}>{m[4]}</code>);
        last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

// ─── Groq API ─────────────────────────────────────────────────────────────────

async function callGroq(model: string, systemPrompt: string, history: { role: "user" | "assistant"; content: string }[]): Promise<string> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model, max_tokens: 768, temperature: 0.7, messages: [{ role: "system", content: systemPrompt }, ...history] }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Object.assign(new Error(err?.error?.message ?? `HTTP ${res.status}`), { status: res.status });
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a response.";
}

function parseGroqError(err: any): string {
    const status = err?.status, msg = (err?.message ?? "").toLowerCase();
    if (status === 401) return "Invalid API key — please update GROQ_API_KEY in Secrets.ts.";
    if (status === 429) return "Rate limit reached — wait a moment and try again.";
    if (status === 503 || msg.includes("unavailable")) return "Groq servers are temporarily unavailable.";
    if (msg.includes("model")) return "Model unavailable. Try Llama 3.1 8B instead.";
    return err?.message || "Failed to reach Groq. Check your API key and connection.";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatBotView({
                                materials, floors = [],
                                isAdmin = false,
                                onAddMaterial, onEditMaterial, onDeleteMaterial,
                            }: ChatBotViewProps) {
    const [isOpen,        setIsOpen]        = useState(false);
    const [messages,      setMessages]      = useState<Message[]>([]);
    const [input,         setInput]         = useState("");
    const [isLoading,     setIsLoading]     = useState(false);
    const [error,         setError]         = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [modelOpen,     setModelOpen]     = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef       = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);
    useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 80); }, [isOpen]);
    useEffect(() => {
        if (!modelOpen) return;
        const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest("[data-model-menu]")) setModelOpen(false); };
        window.addEventListener("click", h);
        return () => window.removeEventListener("click", h);
    }, [modelOpen]);

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        const userMsg: Message = { id: uid(), role: "user", content: text, time: timeStr() };
        const history = [...messages, userMsg];
        setMessages(history);
        setInput("");
        setIsLoading(true);
        setError(null);

        try {
            const rawReply = await callGroq(
                selectedModel,
                buildSystemPrompt(materials, floors, isAdmin),
                history
                    .filter(m => m.role === "user" || m.role === "assistant")
                    .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
            );

            // Extract and execute admin actions if present
            let displayText = rawReply;
            let actions: ActionResult[] | undefined;

            if (isAdmin) {
                const adminRequests = extractAdminBlock(rawReply);
                if (adminRequests?.length) {
                    actions = executeAdminActions(adminRequests, materials, onAddMaterial, onEditMaterial, onDeleteMaterial);
                    displayText = stripJsonBlocks(rawReply);
                }
            }

            setMessages(prev => [...prev, {
                id: uid(), role: "assistant",
                content: displayText || "Done.",
                time: timeStr(),
                actions,
            }]);
        } catch (err: any) {
            setError(parseGroqError(err));
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, selectedModel, materials, floors, isAdmin, onAddMaterial, onEditMaterial, onDeleteMaterial]);

    const clearChat = () => { setMessages([]); setError(null); setIsLoading(false); };
    const activeModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];
    const chips = isAdmin ? ADMIN_CHIP_SUGGESTIONS : CHIP_SUGGESTIONS;

    return (
        <>
            <style>{`
        @keyframes vvchat-spin { to { transform: rotate(360deg); } }
        @keyframes vvchat-pop  { from { opacity:0; transform: scale(0.94) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes vvchat-dot  { 0%,100% { opacity:.3; transform: scale(0.8); } 50% { opacity:1; transform: scale(1.2); } }
        .vvchat-window { animation: vvchat-pop 0.22s cubic-bezier(0.34,1.4,0.64,1); }
        .vvchat-msg    { animation: vvchat-pop 0.18s ease; }
        .vvchat-chip:hover { background: ${C.userBubble} !important; border-color: ${C.userBdr} !important; color: ${C.userText} !important; }
      `}</style>

            <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>

                {/* FAB */}
                {!isOpen && (
                    <button onClick={() => setIsOpen(true)} title="Open VIVITA Assistant"
                            style={{ width: 56, height: 56, borderRadius: "50%", background: C.headerBg, border: `2px solid ${C.headerBdr}`, boxShadow: "0 4px 20px rgba(220,140,0,0.22)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                        <MessageSquare size={24} color={C.avatarIcon} />
                    </button>
                )}

                {/* Chat window */}
                {isOpen && (
                    <div className="vvchat-window" style={{ width: 420, height: 640, display: "flex", flexDirection: "column", background: C.windowBg, borderRadius: 22, border: `1.5px solid ${isAdmin ? C.adminBdr : C.headerBdr}`, boxShadow: "0 12px 48px rgba(180,100,0,0.14)", overflow: "hidden" }}>

                        {/* Header */}
                        <div style={{ background: isAdmin ? C.adminBg : C.headerBg, borderBottom: `1.5px solid ${isAdmin ? C.adminBdr : C.headerBdr}`, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.avatarBg, border: `1.5px solid ${C.headerBdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {isAdmin ? <ShieldCheck size={20} color={C.avatarIcon} /> : <Bot size={20} color={C.avatarIcon} />}
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.2, display: "flex", alignItems: "center", gap: 6 }}>
                                        VIVITA Assistant
                                        {isAdmin && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: C.adminBdr, color: C.adminTxt, fontWeight: 700 }}>ADMIN</span>}
                                    </div>
                                    <div style={{ fontSize: 11.5, color: C.muted, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#5CB85C", display: "inline-block" }} />
                                        Online · {activeModel.label}
                                        {isAdmin && <span style={{ color: C.adminTxt }}> · can edit materials</span>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                {messages.length > 0 && (
                                    <button onClick={clearChat} title="Clear chat"
                                            style={{ background: "rgba(200,130,0,0.1)", border: `1px solid ${C.headerBdr}`, cursor: "pointer", width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, transition: "background 0.12s" }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(200,130,0,0.2)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(200,130,0,0.1)")}
                                    ><Trash2 size={15} /></button>
                                )}
                                <button onClick={() => setIsOpen(false)} title="Close"
                                        style={{ background: "rgba(200,130,0,0.1)", border: `1px solid ${C.headerBdr}`, cursor: "pointer", width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, transition: "background 0.12s" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(200,130,0,0.2)")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(200,130,0,0.1)")}
                                ><X size={16} /></button>
                            </div>
                        </div>

                        {/* Model selector */}
                        <div data-model-menu style={{ padding: "8px 14px", background: C.modelBar, borderBottom: `1px solid ${C.border}`, flexShrink: 0, position: "relative" }}>
                            <button data-model-menu onClick={e => { e.stopPropagation(); setModelOpen(p => !p); }}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 12px", background: C.windowBg, border: `1px solid ${C.border}`, borderRadius: 11, cursor: "pointer", fontSize: 12.5, color: C.text }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 20, background: C.freeBadgeBg, color: C.freeBadgeTxt, fontWeight: 600 }}>Free</span>
                                    <span style={{ fontWeight: 600 }}>{activeModel.label}</span>
                                    <span style={{ color: C.muted, fontSize: 11.5 }}>{activeModel.note}</span>
                                </div>
                                <ChevronDown size={14} color={C.muted} style={{ transition: "transform 0.15s", transform: modelOpen ? "rotate(180deg)" : "none" }} />
                            </button>
                            {modelOpen && (
                                <div data-model-menu style={{ position: "absolute", top: "calc(100% + 3px)", left: 14, right: 14, background: C.windowBg, border: `1px solid ${C.border}`, borderRadius: 13, zIndex: 20, overflow: "hidden", boxShadow: "0 8px 28px rgba(180,100,0,0.14)" }}>
                                    {MODELS.map((m, i) => (
                                        <button key={m.id} data-model-menu onClick={() => { setSelectedModel(m.id); setModelOpen(false); setError(null); }}
                                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "11px 16px", background: m.id === selectedModel ? C.selectedBg : "transparent", border: "none", borderBottom: i < MODELS.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", fontSize: 13, color: C.text, textAlign: "left" }}
                                        >
                                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                <span style={{ fontWeight: m.id === selectedModel ? 700 : 400 }}>{m.label}</span>
                                                <span style={{ color: C.muted, fontSize: 11.5 }}>{m.note}</span>
                                            </div>
                                            {m.id === selectedModel && <Check size={14} color={C.checkColor} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

                            {/* Empty state */}
                            {messages.length === 0 && !error && (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center", padding: "24px 20px" }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 18, background: C.avatarBg, border: `1.5px solid ${C.headerBdr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {isAdmin ? <ShieldCheck size={28} color={C.avatarIcon} /> : <Bot size={28} color={C.avatarIcon} />}
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>VIVITA Assistant</div>
                                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                                        {isAdmin
                                            ? <>You're in <strong>admin mode</strong>.<br />Ask me to add, edit, or delete materials directly.</>
                                            : <>Ask me about materials,<br />stock levels, or locations.</>
                                        }
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginTop: 6 }}>
                                        {chips.map(chip => (
                                            <button key={chip} className="vvchat-chip"
                                                    onClick={() => { setInput(chip); setTimeout(() => inputRef.current?.focus(), 50); }}
                                                    style={{ padding: "7px 14px", borderRadius: 22, fontSize: 12, background: C.chipBg, border: `1px solid ${C.chipBdr}`, color: C.chipTxt, cursor: "pointer", transition: "all 0.12s" }}
                                            >{chip}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bubbles */}
                            {messages.map(msg => (
                                <div key={msg.id} className="vvchat-msg" style={{ display: "flex", gap: 10, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                    {msg.role !== "user" && (
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2, background: C.avatarBg, border: `1px solid ${C.headerBdr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {isAdmin ? <ShieldCheck size={15} color={C.avatarIcon} /> : <Bot size={15} color={C.avatarIcon} />}
                                        </div>
                                    )}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: "80%", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                        <div style={{
                                            padding: "11px 15px", fontSize: 13.5, lineHeight: 1.65, wordBreak: "break-word",
                                            ...(msg.role === "user"
                                                    ? { background: C.userBubble, border: `1px solid ${C.userBdr}`, color: C.userText, borderRadius: "18px 18px 5px 18px", whiteSpace: "pre-wrap" }
                                                    : { background: C.asstBubble, border: `1px solid ${C.asstBdr}`, color: C.asstText, borderRadius: "18px 18px 18px 5px" }
                                            ),
                                        }}>
                                            {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                                        </div>

                                        {/* Action results badge */}
                                        {msg.actions && msg.actions.length > 0 && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                                                {msg.actions.map((a, i) => (
                                                    <div key={i} style={{
                                                        display: "flex", alignItems: "center", gap: 6,
                                                        padding: "5px 10px", borderRadius: 10, fontSize: 11.5,
                                                        background: a.ok ? C.sysBubble : C.errorBg,
                                                        border: `1px solid ${a.ok ? C.sysBdr : C.errorBdr}`,
                                                        color: a.ok ? C.sysText : C.errorTxt,
                                                    }}>
                                                        <Zap size={11} style={{ flexShrink: 0 }} />
                                                        {a.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <span style={{ fontSize: 10.5, color: C.hint, padding: "0 4px" }}>{msg.time}</span>
                                    </div>
                                </div>
                            ))}

                            {/* Typing dots */}
                            {isLoading && (
                                <div className="vvchat-msg" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.avatarBg, border: `1px solid ${C.headerBdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Bot size={15} color={C.avatarIcon} />
                                    </div>
                                    <div style={{ padding: "13px 18px", borderRadius: "18px 18px 18px 5px", background: C.asstBubble, border: `1px solid ${C.asstBdr}`, display: "flex", gap: 6, alignItems: "center" }}>
                                        {[0, 0.18, 0.36].map((delay, i) => (
                                            <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.dotColor, display: "inline-block", animation: `vvchat-dot 1.1s ease ${delay}s infinite` }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div style={{ padding: "11px 15px", borderRadius: 12, background: C.errorBg, border: `1px solid ${C.errorBdr}`, fontSize: 13, color: C.errorTxt, lineHeight: 1.55 }}>
                                    ⚠ {error}
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input bar */}
                        <div style={{ borderTop: `1.5px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "flex-end", gap: 10, background: C.inputBg, flexShrink: 0 }}>
              <textarea
                  ref={inputRef} rows={1} value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={isAdmin ? "Tell me what to add, edit, or delete…" : "Ask about materials…"}
                  disabled={isLoading}
                  style={{ flex: 1, padding: "11px 15px", border: `1.5px solid ${C.border}`, borderRadius: 14, resize: "none", outline: "none", fontFamily: "inherit", fontSize: 13.5, color: C.text, background: C.windowBg, lineHeight: 1.5, maxHeight: 110, overflowY: "auto", transition: "border-color 0.15s" }}
                  onFocus={e  => (e.currentTarget.style.borderColor = C.borderFocus)}
                  onBlur={e   => (e.currentTarget.style.borderColor = C.border)}
                  onInput={e  => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 110) + "px"; }}
              />
                            <button onClick={sendMessage} disabled={isLoading || !input.trim()}
                                    style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: input.trim() && !isLoading ? C.sendActive : C.surface, border: `1.5px solid ${input.trim() && !isLoading ? C.userBdr : C.border}`, cursor: input.trim() && !isLoading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.12s, transform 0.1s" }}
                                    onMouseEnter={e => { if (!isLoading && input.trim()) { e.currentTarget.style.background = C.sendHover; e.currentTarget.style.transform = "scale(1.04)"; } }}
                                    onMouseLeave={e => { if (!isLoading && input.trim()) { e.currentTarget.style.background = C.sendActive; e.currentTarget.style.transform = "scale(1)"; } }}
                            >
                                {isLoading ? <Loader2 size={17} color={C.muted} style={SPIN} /> : <Send size={16} color={input.trim() ? C.sendIcon : C.hint} />}
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </>
    );
}