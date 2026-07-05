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
                height: "200px",
                background: "white",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                padding: "2.5px",
                borderRadius: "5px",
                border: "1px solid black",
            }}
        >
            <input
                ref={inputRef}
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search..."
                style={{
                    color:"black",
                    fontFamily: "monospace",
                    height: "20px",
                    fontSize: "12.5px",
                    outline: "none",
                    border: "none",
                    background: "transparent",
                    flexShrink: 0,
                    boxShadow: "none",
                }}
            />

            <div
                style={{
                    background: "white",
                    width: "100%",
                    flex: 1,
                    overflowY: "auto",
                    gap: "2.5px",
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
                                padding: "0px",
                                background: "transparent",
                                border: "none",
                                borderBottom: "1px solid black",
                                cursor: "pointer",
                                color:"black"
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