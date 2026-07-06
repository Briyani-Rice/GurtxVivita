import { ReactElement, useEffect, useState, useRef } from "react";
import { CommandArgumentType } from "./types";
import { commands } from "./app";

function getTypeString(arg: CommandArgumentType): String {
    switch (arg) {
        case CommandArgumentType.Boolean:
            return "Bool";
        case CommandArgumentType.Number:
            return "Num";
        case CommandArgumentType.String:
            return "Str";
        default:
            return "Obj";
    }
}

export type CmdProps = {
    setVisibility: (b: boolean) => void;
};

export function CommandBar({ setVisibility }: CmdProps): ReactElement {
    const [text, setText] = useState("");
    const menuRef = useRef<HTMLDivElement | null>(null);

    const visCommands = commands.filter(command =>
        command.name.toLowerCase().includes(text.toLowerCase())
    );

    const [bounds, setBounds] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const updateBounds = () => {
            const titleMain = document.querySelector(".title-main");
            if (titleMain) {
                const rect = titleMain.getBoundingClientRect();
                setBounds({
                    left: rect.left,
                    width: rect.width,
                });
            }
        };

        updateBounds();
        window.addEventListener("resize", updateBounds);

        return () => window.removeEventListener("resize", updateBounds);
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setVisibility(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [setVisibility]);

    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setVisibility(false);
            }
        };

        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, [setVisibility]);

    const inputRef = useRef(null);
    useEffect(() => {
        // @ts-ignore
        inputRef.current.focus();
    }, []);

    return (
        <div
            ref={menuRef}
            style={{
                position: "absolute",
                top: "7.5px",
                left: `${bounds.left}px`,
                width: `${bounds.width}px`,
                zIndex: 1000000000,
                height: "240px",
                background: "var(--viventory-welcome-card)",
                color: "var(--viventory-text)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                padding: "8px",
                borderRadius: "14px",
                border: "1px solid var(--viventory-border)",
                boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
                backdropFilter: "blur(18px)",
            }}
        >
            <input
                ref={inputRef}
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search..."
                style={{
                    color:"var(--viventory-text)",
                    fontFamily: "monospace",
                    height: "36px",
                    fontSize: "14px",
                    outline: "none",
                    border: "1px solid var(--viventory-border)",
                    borderRadius: "10px",
                    background: "var(--viventory-surface)",
                    flexShrink: 0,
                    boxShadow: "none",
                    padding: "0 12px",
                }}
            />

            <div
                style={{
                    background: "transparent",
                    width: "100%",
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    paddingTop: "8px",
                }}
            >
                {visCommands.map((value) => {
                    const args = value.args
                        .map(arg => `[${arg.Name} ${getTypeString(arg.Type)}]`)
                        .join(" ");

                    return (
                        <button
                            key={value.name}
                            style={{
                                width: "100%",
                                textAlign: "left",
                                fontFamily: "monospace",
                                fontSize: "13px",
                                padding: "9px 10px",
                                background: "var(--viventory-surface)",
                                border: "1px solid var(--viventory-border)",
                                borderRadius: "10px",
                                cursor: "pointer",
                                color:"var(--viventory-text)"
                            }}
                            onClick={()=>{
                                value.onRun()
                                setVisibility(false)
                            }}
                        >
                            {`> ${value.name} ${args}`}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
