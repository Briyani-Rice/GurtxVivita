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
import { platform } from "@tauri-apps/plugin-os";
import type { Tab } from "../types";
import heroImage from "../assets/hero.png";
import {
    answerMakerQuery,
    projectIdeas,
    type MakerAnswer,
    type MakerAnswerSection,
    type MakerItem,
    type MakerProjectIdea,
} from "./makerspaceData";
import { useInventory } from "./InventoryProvider";

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

function isMobilePlatform(): boolean {
    try {
        const p = platform();
        return p === "android" || p === "ios";
    } catch {
        // platform() throws outside a Tauri context (e.g. web preview)
        return false;
    }
}

function createStyles(isMobile: boolean): Record<string, React.CSSProperties> {
    return {
        shell: isMobile
            ? {
                // Natural content height on mobile — the scrollable ancestor lives
                // in App.tsx's content wrapper, not here. Fighting it with grid
                // rows / overflow:auto here is what breaks scrolling.
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
                background: palette.panel,
                color: palette.ink,
                fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }
            : {
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
            minHeight: isMobile ? undefined : 0,
            padding: isMobile ? "16px" : 24,
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 14 : 16,
            overflow: isMobile ? "visible" : "hidden",
        },
        header: {
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr)",
            alignItems: "center",
            gap: isMobile ? 12 : 18,
        },
        mascot: {
            width: isMobile ? 64 : 96,
            height: isMobile ? 64 : 96,
            borderRadius: isMobile ? 20 : 28,
            background: `linear-gradient(145deg, ${palette.sunny}, ${palette.mint})`,
            border: "3px solid #fff",
            boxShadow: "0 18px 34px rgba(36,38,43,0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            flexShrink: 0,
        },
        eyebrow: {
            margin: 0,
            color: palette.deepSky,
            fontSize: isMobile ? 12 : 14,
            fontWeight: 800,
            letterSpacing: 0,
            textTransform: "uppercase",
        },
        title: {
            margin: "4px 0 0",
            fontSize: isMobile ? 24 : 38,
            lineHeight: 1.08,
            letterSpacing: 0,
            fontWeight: 850,
        },
        subtitle: {
            margin: "8px 0 0",
            maxWidth: 760,
            color: palette.muted,
            fontSize: isMobile ? 14 : 16,
            lineHeight: 1.45,
            display: isMobile ? "none" : "block",
        },
        promptGrid: {
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
            gap: isMobile ? 8 : 10,
        },
        promptButton: {
            minHeight: isMobile ? 48 : 56,
            borderRadius: 6,
            border: `1px solid ${palette.line}`,
            background: palette.panel,
            color: palette.ink,
            padding: isMobile ? "8px 10px" : "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            textAlign: "left",
            cursor: "pointer",
            fontSize: isMobile ? 12.5 : 14,
            fontWeight: 750,
            boxShadow: "0 8px 20px rgba(36,38,43,0.08)",
        },
        conversation: {
            flex: isMobile ? "none" : 1,
            minHeight: isMobile ? undefined : 0,
            overflow: isMobile ? "visible" : "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 2,
        },
        assistantBubble: {
            alignSelf: "flex-start",
            maxWidth: isMobile ? "100%" : "86%",
            borderRadius: "6px",
            border: `1px solid ${palette.line}`,
            background: "rgba(255,253,246,0.94)",
            padding: isMobile ? 13 : 16,
            boxShadow: "0 8px 22px rgba(36,38,43,0.08)",
            fontSize: isMobile ? 14.5 : 16,
            lineHeight: 1.45,
        },
        childBubble: {
            alignSelf: "flex-end",
            maxWidth: isMobile ? "88%" : "76%",
            borderRadius: "6px",
            background: palette.sky,
            color: "#FFFDF6",
            padding: "13px 15px",
            boxShadow: "0 8px 18px rgba(36,38,43,0.18)",
            fontSize: isMobile ? 14.5 : 16,
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
            // Not sticky on mobile: a sticky element here can overlap the
            // separate fixed floating tab bar. main's bottom padding already
            // keeps this clear of that bar in normal flow.
            position: "static",
        },
        input: {
            minHeight: isMobile ? 48 : 56,
            border: "none",
            outline: "none",
            background: "transparent",
            color: palette.ink,
            fontSize: isMobile ? 15 : 17,
            padding: "0 10px",
            minWidth: 0,
        },
        sendButton: {
            minHeight: isMobile ? 48 : 56,
            minWidth: isMobile ? 52 : 64,
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
            borderLeft: isMobile ? "none" : `1px solid ${palette.line}`,
            borderTop: isMobile ? `1px solid ${palette.line}` : "none",
            background: palette.panel,
            padding: isMobile ? "16px" : 18,
            overflow: isMobile ? "visible" : "auto",
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
            height: isMobile ? 110 : 150,
            objectFit: "contain",
            background: `linear-gradient(135deg, ${palette.softYellow}, ${palette.mint})`,
            padding: isMobile ? 12 : 18,
            boxSizing: "border-box",
        },
        railTitle: {
            margin: 0,
            fontSize: isMobile ? 16 : 18,
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
            fontSize: 12,
            fontWeight: 800,
        },
    };
}

function makeId(): string {
    return typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function formatSection(section: MakerAnswerSection, styles: Record<string, React.CSSProperties>) {
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

function ProjectCard({ project, styles }: { project: MakerProjectIdea; styles: Record<string, React.CSSProperties> }) {
    return (
        <div style={{ ...styles.itemCard, background: palette.paper }}>
            <span style={styles.badge}>
                <Lightbulb size={14} />
                {project.difficulty}
            </span>
            <strong>{project.name}</strong>
            <span style={{ color: palette.muted, fontSize: 14, lineHeight: 1.4 }}>{project.summary}</span>
        </div>
    );
}

function ItemCard({ item, styles }: { item: MakerItem; styles: Record<string, React.CSSProperties> }) {
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

function AssistantAnswer({ answer, styles }: { answer: MakerAnswer; styles: Record<string, React.CSSProperties> }) {
    return (
        <>
            <strong style={{ fontSize: 18 }}>{answer.title}</strong>
            {answer.sections.map(section => formatSection(section, styles))}
            {answer.projects.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginTop: 12 }}>
                    {answer.projects.map(project => <ProjectCard key={project.id} project={project} styles={styles} />)}
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
    const [input, setInput] = useState("");
    const conversationEndRef = useRef<HTMLDivElement>(null);
    const isMobile = useMemo(() => isMobilePlatform(), []);
    const styles = useMemo(() => createStyles(isMobile), [isMobile]);

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
                        <Bot size={isMobile ? 36 : 54} color={palette.ink} />
                        <Sparkles size={isMobile ? 16 : 22} color={palette.deepSky} style={{ position: "absolute", right: 10, top: 8 }} />
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
                            <ChevronRight size={16} />
                        </button>
                    ))}
                </section>

                <section style={styles.conversation} aria-label="Chat with VIVI Bot">
                    {messages.map(message => (
                        <div
                            key={message.id}
                            style={message.role === "assistant" ? styles.assistantBubble : styles.childBubble}
                        >
                            {message.answer ? <AssistantAnswer answer={message.answer} styles={styles} /> : message.text}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <Search size={20} color={palette.muted} />
                        <input
                            style={styles.input}
                            value={input}
                            onChange={event => setInput(event.currentTarget.value)}
                            placeholder={isMobile ? "Ask VIVI Bot..." : "Ask: where is cardboard, how do I use LEDs, what can I make..."}
                        />
                    </div>
                    <button type="submit" style={styles.sendButton} aria-label="Send question">
                        <Send size={isMobile ? 20 : 24} />
                    </button>
                </form>
            </main>

            <aside style={styles.rail}>
                <div style={styles.visualPanel}>
                    <img src={heroImage} alt="VIVITA-style maker illustration" style={styles.visualImage} />
                    <div style={{ padding: isMobile ? 12 : 14 }}>
                        <h2 style={styles.railTitle}>Maker mode</h2>
                        <p style={{ color: palette.muted, margin: "6px 0 0", fontSize: 14, lineHeight: 1.45 }}>
                            No child login. Fast answers. Clear safety notes before risky tools.
                        </p>
                    </div>
                </div>

                <section>
                    <h2 style={styles.railTitle}>Popular things to find</h2>
                    <div
                        style={{
                            display: isMobile ? "grid" : "flex",
                            gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : undefined,
                            flexDirection: isMobile ? undefined : "column",
                            gap: 10,
                            marginTop: 10,
                        }}
                    >
                        {featuredItems.map(item => <ItemCard key={item.id} item={item} styles={styles} />)}
                    </div>
                </section>

                <section style={styles.visualPanel}>
                    <div style={{ padding: isMobile ? 12 : 14 }}>
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