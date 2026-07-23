import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    Bot,
    ChevronRight,
    Lightbulb,
    MapPin,
    Package,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    Wrench,
} from "lucide-react";
import type { Tab } from "../types";
import heroImage from "../assets/hero.png";
import {
    answerMakerQuery,
    type MakerAnswer,
    type MakerAnswerSection,
    type MakerItem,
    type MakerProjectIdea,
} from "./makerspaceData";
import { useInventory } from "./InventoryProvider";
import { isSafeHttpUrl, openExternalUrl } from "../utils/externalUrl";
import { getCurrentLanguage, translateDifficulty } from "../i18n/i18n";

type ChatMessage = {
    id: string;
    role: "assistant" | "child";
    text: string;
    answer?: MakerAnswer;
};

const quickPrompts = [
    "Where is the hot glue gun?",
    "How do I use a micro:bit?",
    "What can I make with cardboard and LEDs?",
    "What tools are available?",
];

const palette = {
    ink: "#24262B",
    muted: "#838998",
    pegboardText: "#5E4B2E",
    sky: "#33A7B5",
    deepSky: "#277987",
    sunny: "#FFF5CB",
    softYellow: "#FFF5CB",
    mint: "#A5D6D1",
    coral: "#A1824F",
    paper: "#FFFDF6",
    panel: "#FFFDF6",
    line: "#D7CFBF",
    warning: "#FFF5CB",
    warningLine: "#A1824F",
};

const styles: Record<string, React.CSSProperties> = {
    shell: {
        height: "100%",
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 360px",
        background: palette.panel,
        color: palette.ink,
        overflow: "hidden",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    main: {
        minWidth: 0,
        minHeight: 0,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflow: "hidden",
    },
    header: {
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr)",
        alignItems: "center",
        gap: 18,
    },
    mascot: {
        width: 96,
        height: 96,
        borderRadius: 28,
        background: `linear-gradient(145deg, ${palette.sunny}, ${palette.mint})`,
        border: "3px solid #fff",
        boxShadow: "0 18px 34px rgba(36,38,43,0.16)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    eyebrow: {
        margin: 0,
        color: palette.deepSky,
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: 0,
        textTransform: "uppercase",
    },
    title: {
        margin: "4px 0 0",
        fontSize: 38,
        lineHeight: 1.04,
        letterSpacing: 0,
        fontWeight: 850,
    },
    subtitle: {
        margin: "8px 0 0",
        maxWidth: 760,
        color: palette.muted,
        fontSize: 16,
        lineHeight: 1.45,
    },
    promptGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 10,
    },
    promptButton: {
        minHeight: 56,
        borderRadius: 6,
        border: `1px solid ${palette.line}`,
        background: palette.panel,
        color: palette.ink,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        textAlign: "left",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 750,
        boxShadow: "0 8px 20px rgba(36,38,43,0.08)",
    },
    conversation: {
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 2,
    },
    assistantBubble: {
        alignSelf: "flex-start",
        maxWidth: "86%",
        borderRadius: "6px",
        border: `1px solid ${palette.line}`,
        background: "rgba(255,253,246,0.94)",
        padding: 16,
        boxShadow: "0 8px 22px rgba(36,38,43,0.08)",
        fontSize: 16,
        lineHeight: 1.45,
    },
    childBubble: {
        alignSelf: "flex-end",
        maxWidth: "76%",
        borderRadius: "6px",
        background: palette.sky,
        color: "#FFFDF6",
        padding: "13px 15px",
        boxShadow: "0 8px 18px rgba(36,38,43,0.18)",
        fontSize: 16,
        lineHeight: 1.4,
        fontWeight: 650,
    },
    section: {
        borderTop: `1px solid ${palette.line}`,
        marginTop: 12,
        paddingTop: 12,
    },
    safety: {
        border: `2px solid ${palette.warningLine}`,
        background: palette.warning,
        borderRadius: 6,
        padding: 13,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
    },
    inputBar: {
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 10,
        padding: 10,
        border: `1px solid ${palette.line}`,
        borderRadius: 6,
        background: "rgba(255,253,246,0.92)",
        boxShadow: "0 12px 28px rgba(36,38,43,0.1)",
    },
    input: {
        minHeight: 56,
        border: "none",
        outline: "none",
        background: "transparent",
        color: palette.ink,
        fontSize: 17,
        padding: "0 10px",
    },
    sendButton: {
        minHeight: 56,
        minWidth: 64,
        border: "none",
        borderRadius: 6,
        background: palette.mint,
        color: palette.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },
    rail: {
        minWidth: 0,
        minHeight: 0,
        borderLeft: `1px solid ${palette.line}`,
        background: palette.panel,
        padding: 18,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
    },
    visualPanel: {
        borderRadius: 6,
        background: palette.panel,
        border: `1px solid ${palette.line}`,
        boxShadow: "0 12px 30px rgba(36,38,43,0.1)",
        overflow: "hidden",
    },
    visualImage: {
        width: "100%",
        height: 150,
        objectFit: "contain",
        background: `linear-gradient(135deg, ${palette.softYellow}, ${palette.mint})`,
        padding: 18,
        boxSizing: "border-box",
    },
    railTitle: {
        margin: 0,
        fontSize: 18,
        fontWeight: 850,
        letterSpacing: 0,
    },
    itemCard: {
        border: `1px solid ${palette.line}`,
        background: palette.panel,
        borderRadius: 6,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        width: "fit-content",
        borderRadius: 4,
        background: "rgba(165, 214, 209, 0.34)",
        color: palette.deepSky,
        padding: "4px 9px",
        fontSize: 14,
        fontWeight: 800,
    },
};

function makeId(): string {
    return typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function formatSection(section: MakerAnswerSection) {
    if (section.kind === "safety") {
        return (
            <div key={`${section.kind}-${section.title}`} style={styles.safety}>
                <AlertTriangle size={24} color={palette.warningLine} />
                <div>
                    <strong>{section.title}</strong>
                    <p style={{ margin: "5px 0 0", color: palette.ink }}>{section.body}</p>
                </div>
            </div>
        );
    }

    return (
        <div key={`${section.kind}-${section.title}`} style={styles.section}>
            <strong>{section.title}</strong>
            <p style={{ margin: "6px 0 0", whiteSpace: "pre-line", color: palette.ink }}>{section.body}</p>
        </div>
    );
}

function ProjectCard({ project }: { project: MakerProjectIdea }) {
    return (
        <div style={{ ...styles.itemCard, background: palette.paper }}>
            <span style={styles.badge}>
                <Lightbulb size={14} />
                {translateDifficulty(getCurrentLanguage(), project.difficulty)}
            </span>
            <strong>{project.name}</strong>
            <span style={{ color: palette.muted, fontSize: 14, lineHeight: 1.4 }}>{project.summary}</span>
        </div>
    );
}

function ItemCard({ item }: { item: MakerItem }) {
    return (
        <div style={styles.itemCard}>
            <span style={styles.badge}>
                {item.type === "tool" ? <Wrench size={14} /> : <Package size={14} />}
                {item.type}
            </span>
            <strong>{item.name}</strong>
            <span style={{ color: palette.muted, fontSize: 14 }}>{item.location.zone}</span>
            <span style={{ color: palette.ink, fontWeight: 800 }}>
                {item.quantity} {item.unit}
            </span>
            {item.safetyLevel === "adult" && (
                <span style={{ ...styles.badge, background: palette.warning, color: palette.pegboardText }}>
                    <ShieldCheck size={14} />
                    Adult help
                </span>
            )}
        </div>
    );
}

function AssistantAnswer({ answer }: { answer: MakerAnswer }) {
    return (
        <>
            <strong style={{ fontSize: 18 }}>{answer.title}</strong>
            {answer.sections.map(formatSection)}
            {isSafeHttpUrl(answer.item?.imageUrl) && (
                <img
                    src={answer.item!.imageUrl}
                    alt={`Photo of ${answer.item!.name}`}
                    style={{ display: "block", maxWidth: "100%", maxHeight: 220, borderRadius: 6, marginTop: 12, border: `1px solid ${palette.line}` }}
                    onError={event => { event.currentTarget.style.display = "none"; }}
                />
            )}
            {isSafeHttpUrl(answer.item?.videoUrl) && (
                <button
                    type="button"
                    onClick={() => { void openExternalUrl(answer.item!.videoUrl!); }}
                    style={{ ...styles.badge, background: palette.sky, color: "#FFFDF6", marginTop: 12, fontSize: 14, border: "none", cursor: "pointer" }}
                >
                    ▶ Watch a short video
                </button>
            )}
            {answer.projects.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 12 }}>
                    {answer.projects.map(project => <ProjectCard key={project.id} project={project} />)}
                </div>
            )}
            {answer.suggestedPrompts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                    {answer.suggestedPrompts.map(prompt => (
                        <span key={prompt} style={{ ...styles.badge, background: palette.mint, color: palette.ink }}>
                            {prompt}
                        </span>
                    ))}
                </div>
            )}
        </>
    );
}

export function MakerKiosk() {
    const inventory = useInventory();
    const makerItems = inventory.makerItems;
    const projectIdeas = inventory.projectIdeas;
    const [input, setInput] = useState("");
    const conversationEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<ChatMessage[]>(() => [
        {
            id: makeId(),
            role: "assistant",
            text: "Hi, I am VIVI Bot. I can help you find materials, learn how to use tools safely, and choose something to make.",
            answer: answerMakerQuery("", makerItems, projectIdeas),
        },
    ]);

    const featuredItems = useMemo(
        () => makerItems.filter(item => ["hot-glue-gun", "microbit", "cardboard", "leds"].includes(item.id)),
        [makerItems],
    );

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    const ask = (prompt: string) => {
        const query = prompt.trim();
        if (!query) return;

        const answer = answerMakerQuery(query, makerItems, projectIdeas);
        setMessages(prev => [
            ...prev,
            { id: makeId(), role: "child", text: query },
            { id: makeId(), role: "assistant", text: answer.title, answer },
        ]);
        setInput("");
    };

    return (
        <div style={styles.shell}>
            <main style={styles.main}>
                <header style={styles.header}>
                    <div style={styles.mascot} aria-label="VIVI Bot mascot">
                        <Bot size={54} color={palette.ink} />
                        <Sparkles size={22} color={palette.deepSky} style={{ position: "absolute", right: 12, top: 10 }} />
                    </div>
                    <div>
                        <p style={styles.eyebrow}>VIVITA Makerspace Guide</p>
                        <h1 style={styles.title}>Ask, find, make.</h1>
                        <p style={styles.subtitle}>
                            A self-serve tablet guide for young makers. Ask where something is, how to use it safely, or what you can build with the materials around you.
                        </p>
                    </div>
                </header>

                <section style={styles.promptGrid} aria-label="Quick-start prompts">
                    {quickPrompts.map(prompt => (
                        <button key={prompt} type="button" style={styles.promptButton} onClick={() => ask(prompt)}>
                            <span>{prompt}</span>
                            <ChevronRight size={18} />
                        </button>
                    ))}
                </section>

                <section style={styles.conversation} aria-label="Chat with VIVI Bot">
                    {messages.map(message => (
                        <div
                            key={message.id}
                            style={message.role === "assistant" ? styles.assistantBubble : styles.childBubble}
                        >
                            {message.answer ? <AssistantAnswer answer={message.answer} /> : message.text}
                        </div>
                    ))}
                    <div ref={conversationEndRef} />
                </section>

                <form
                    style={styles.inputBar}
                    onSubmit={(event) => {
                        event.preventDefault();
                        ask(input);
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Search size={22} color={palette.muted} />
                        <input
                            style={styles.input}
                            value={input}
                            onChange={event => setInput(event.currentTarget.value)}
                            placeholder="Ask: where is cardboard, how do I use LEDs, what can I make..."
                        />
                    </div>
                    <button type="submit" style={styles.sendButton} aria-label="Send question">
                        <Send size={24} />
                    </button>
                </form>
            </main>

            <aside style={styles.rail}>
                <div style={styles.visualPanel}>
                    <img src={heroImage} alt="VIVITA-style maker illustration" style={styles.visualImage} />
                    <div style={{ padding: 14 }}>
                        <h2 style={styles.railTitle}>Maker mode</h2>
                        <p style={{ color: palette.muted, margin: "6px 0 0", fontSize: 14, lineHeight: 1.45 }}>
                            No child login. Fast answers. Clear safety notes before risky tools.
                        </p>
                    </div>
                </div>

                <section>
                    <h2 style={styles.railTitle}>Popular things to find</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                        {featuredItems.map(item => <ItemCard key={item.id} item={item} />)}
                    </div>
                </section>

                <section style={styles.visualPanel}>
                    <div style={{ padding: 14 }}>
                        <span style={styles.badge}>
                            <MapPin size={14} />
                            Space map
                        </span>
                        <h2 style={{ ...styles.railTitle, marginTop: 10 }}>Key zones</h2>
                        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                            {["White Space", "Tinkering Studio", "Pegboard Storage", "VIVISTUDIO"].map(zone => (
                                <div key={zone} style={{ display: "flex", alignItems: "center", gap: 8, color: palette.muted, fontSize: 14 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: 2, background: palette.sky }} />
                                    {zone}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </aside>
        </div>
    );
}

export class MakerKioskTab implements Tab {
    id = crypto.randomUUID();
    name = "Maker Bot";
    content = <MakerKiosk />;
}

export default MakerKioskTab;
