//@ts-ignore
import React, {useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom/client'
//@ts-ignore
import './style.css'
import Titlebar from "./titlebar"
import {Command, CommandArgument, CommandArgumentType, Tab} from "./types"
import "react-icons/io"
import {IoIosBook, IoIosCloseCircle, IoIosCloseCircleOutline} from 'react-icons/io'
import {MdAddCircle, MdAddCircleOutline} from "react-icons/md";
import {BsGearFill} from "react-icons/bs";
import {arrayMove, horizontalListSortingStrategy, SortableContext, useSortable} from "@dnd-kit/sortable"

import {CSS} from "@dnd-kit/utilities"
import {closestCenter, DndContext, PointerSensor, useSensor, useSensors} from "@dnd-kit/core";
import {restrictToHorizontalAxis} from "@dnd-kit/modifiers";
import Settings from "./components/Settings/Settings";
import DocsView from "./components/Docs/DocsView";
import {CommandBar} from "./CommandBar";
import LoginTab from "./components/LoginTab";
import {RoomMapTab} from "./components/RoomMapTab";
import {UserViewTab} from "./components/UserViewTab";
import { applyAppearancePrefs, loadAppearancePrefs } from "./components/Settings/appearancePreferences";
import { MakerKioskTab } from "./components/MakerKiosk";
import vivitaLogo from "./assets/vivita-logo.png";
import vivitaSpaceImage from "./assets/vivita-space.png";
import vivitaCommunityImage from "./assets/vivita-community.jpg";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { InventoryProvider } from "./components/InventoryProvider";

export type BasicTabProps = {
    tabs: Tab[];
    setTabs: (tabs: Tab[]) => void;
    tabIndex: number;
    setTabIndex: (index: number) => void;
    handleNewTab: () => number;
    setTab: (index: number, tab: Tab) => void;
    handleClosingTab: (index: number) => void;
    handleMaterialSearch: (query: string) => void;
}

export class SearchCommand implements Command {
    id: string = crypto.randomUUID()
    args: CommandArgument[] = [new CommandArgument("Item",CommandArgumentType.String)]
    name: string = "Search"
    onRun: () => void = ()=>{
        const existingIndex = SearchCommand.bt.tabs.findIndex(tab => tab.name === "Welcome")

        if (existingIndex !== -1) {
            SearchCommand.bt.setTabIndex(existingIndex)
            return
        }

        const newIndex = SearchCommand.bt.handleNewTab()
        SearchCommand.bt.setTab(newIndex, new welcomeTab())
    }
    static bt:BasicTabProps
    static receive (bt0: BasicTabProps):void{
        SearchCommand.bt=bt0;
    }
}

export class HelpCommand implements Command {
    id: string = crypto.randomUUID()
    args: CommandArgument[] = []
    name: string = "Help"
    onRun: () => void = ()=>{
        var nw = HelpCommand.bt.tabs
        nw.push(new DocsView())
        HelpCommand.bt.setTabs(nw)
        HelpCommand.bt.setTabIndex(nw.length-1)
    }
    static bt:BasicTabProps
    static receive (bt0: BasicTabProps):void{
        HelpCommand.bt=bt0;
    }
}


export class SettingCommand implements Command {
    id: string = crypto.randomUUID()
    args: CommandArgument[] = []
    name: string = "Settings"
    onRun: () => void = ()=>{
        var nw = HelpCommand.bt.tabs
        nw.push(new Settings())
        HelpCommand.bt.setTabs(nw)
        HelpCommand.bt.setTabIndex(nw.length-1)
    }
}


export class LoginCommand implements Command {
    id: string = crypto.randomUUID()
    args: CommandArgument[] = []
    name: string = "Login"
    onRun: () => void = ()=>{
        var nw = HelpCommand.bt.tabs
        nw.push(new LoginTab(HelpCommand.bt,nw.length))
        HelpCommand.bt.setTabs(nw)
        HelpCommand.bt.setTabIndex(nw.length-1)
    }
}

export var commands:Command[] = [new SearchCommand(),new HelpCommand(),new SettingCommand(),new LoginCommand()]

export class welcomeTab implements Tab {

    id = crypto.randomUUID()
    name: string = "Welcome"
    content: React.ReactNode
    static props:BasicTabProps

    constructor() {
        this.content = this.loadContent()
    }
    static SetProps(_: { tabs: Tab[] }, basicTabProps: BasicTabProps){
        this.props = basicTabProps
    }
    loadContent(){
        const openTab = (name: string, tabFactory: () => Tab) => {
            const existingIndex = welcomeTab.props.tabs.findIndex(tab => tab.name === name);

            if (existingIndex !== -1) {
                welcomeTab.props.setTabIndex(existingIndex);
                return;
            }

            const newIndex = welcomeTab.props.handleNewTab();
            welcomeTab.props.setTab(newIndex, tabFactory());
        };

        const buttonStyle = (variant: "primary" | "secondary" = "secondary"): React.CSSProperties => ({
            minHeight: "44px",
            padding: "0 18px",
            border: variant === "primary" ? "none" : "1px solid var(--viventory-border)",
            borderRadius: "6px",
            background:
                variant === "primary"
                    ? "linear-gradient(135deg, var(--viventory-welcome-accent), var(--viventory-welcome-accent-2))"
                    : "var(--viventory-surface)",
            color: variant === "primary" ? "var(--viventory-text)" : "var(--viventory-text)",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: variant === "primary" ? "0 14px 28px rgba(36, 38, 43, 0.18)" : "none",
        });

        const searchInputId = "welcome-search";

        return(

            <div
                style={{
                    height: "100%",
                    width: "100%",
                    position: "relative",
                    boxSizing: "border-box",
                    background: "var(--viventory-welcome-bg)",
                    color: "var(--viventory-text)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    backgroundImage:
                        "radial-gradient(var(--viventory-welcome-dot) 1.3px, transparent 1.3px)",
                    backgroundSize: "20px 20px"
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(135deg, rgba(51, 167, 181, 0.22), transparent 38%, rgba(161, 130, 79, 0.18))",
                        pointerEvents: "none",
                    }}
                />

                <main
                    style={{
                        position: "relative",
                        zIndex: 1,
                        flex: 1,
                        width: "100%",
                        maxWidth: "1240px",
                        margin: "0 auto",
                        padding: "clamp(28px, 5vw, 72px)",
                        boxSizing: "border-box",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                        gap: "38px",
                        alignItems: "center",
                    }}
                >
                    <section style={{textAlign: "left"}}>
                        <img
                            src={vivitaLogo}
                            alt="VIVITA"
                            style={{
                                width: "148px",
                                height: "auto",
                                display: "block",
                                marginBottom: "24px",
                            }}
                        />
                        <p
                            style={{
                                margin: "0 0 14px",
                                color: "var(--viventory-welcome-accent)",
                                fontSize: "14px",
                                fontWeight: 800,
                                letterSpacing: "0",
                                textTransform: "uppercase",
                            }}
                        >
                            Maker guide
                        </p>
                    <h1 style={{
                        margin: 0,
                            marginBottom: "18px",
                            fontSize: "64px",
                            lineHeight: 0.95,
                            fontWeight: 800,
                            letterSpacing: "0",
                            color: "var(--viventory-text)",
                    }}>
                            Welcome to VIVITA Singapore
                    </h1>
                        <h2 style={{
                            margin: "0 0 28px",
                            maxWidth: "620px",
                            fontSize: "28px",
                            lineHeight: 1.22,
                            fontWeight: 650,
                            letterSpacing: "0",
                            color: "var(--viventory-muted-text)",
                    }}>
                            Our Vivistop @ 10 Kampong Eunos helps youths find tools, materials, and space to build ideas without waiting for permission.
                        </h2>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                const input = event.currentTarget.elements.namedItem(searchInputId) as HTMLInputElement | null;
                                welcomeTab.props.handleMaterialSearch(input?.value ?? "");
                            }}
                            style={{
                                display: "flex",
                                gap: "12px",
                                alignItems: "center",
                                maxWidth: "640px",
                                marginBottom: "16px",
                            }}
                        >
                    <input
                                id={searchInputId}
                                name={searchInputId}
                        type="search"
                                placeholder="Search materials, tools, or rooms..."
                        onKeyDown={(event) => {
                            if (event.key !== "Enter") {
                                return;
                            }

                            welcomeTab.props.handleMaterialSearch(event.currentTarget.value);
                        }}
                        style={{
                            width: "100%",
                                    minHeight: "54px",
                                    padding: "0 20px",
                                    fontSize: "17px",
                                    fontWeight: 600,
                            fontFamily: "Libre Franklin, sans-serif",
                                    border: "1px solid var(--viventory-border)",
                                    borderRadius: "6px",
                                    background: "var(--viventory-surface)",
                                    color: "var(--viventory-text)",
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "all 120ms ease",
                        }}
                    />
                            <button type="submit" style={buttonStyle("primary")}>
                                Search
                            </button>
                        </form>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "10px",
                                marginBottom: "28px",
                            }}
                        >
                            {["Cardboard", "LEDs", "Hot glue", "Projector"].map(label => (
                                <button
                                    key={label}
                                    onClick={() => welcomeTab.props.handleMaterialSearch(label)}
                                    style={{
                                        border: "1px solid var(--viventory-border)",
                                        borderRadius: "6px",
                                        background: "var(--viventory-welcome-card)",
                                        color: "var(--viventory-text)",
                                        padding: "9px 14px",
                                        fontWeight: 650,
                                        cursor: "pointer",
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div style={{display: "flex", flexWrap: "wrap", gap: "12px"}}>
                            <button
                                onClick={() => openTab("Maker Bot", () => new MakerKioskTab())}
                                style={buttonStyle("primary")}
                            >
                                Open Maker Bot
                            </button>
                            <button
                                onClick={() => openTab("Room map", () => new RoomMapTab())}
                                style={buttonStyle()}
                            >
                                Open Room Map
                            </button>
                        </div>
                    </section>

                    <aside
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "16px",
                            alignItems: "stretch",
                        }}
                    >
                        <div
                            style={{
                                minHeight: "420px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                position: "relative",
                                boxShadow: "0 28px 70px rgba(15, 23, 42, 0.24)",
                                background: "var(--viventory-surface)",
                            }}
                        >
                            <img
                                src={vivitaSpaceImage}
                                alt="VIVITA Singapore makerspace"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: "18px",
                                    right: "18px",
                                    bottom: "18px",
                                    padding: "18px",
                                    borderRadius: "8px",
                                    background: "rgba(17, 24, 39, 0.78)",
                                    color: "#ffffff",
                                    textAlign: "left",
                                }}
                            >
                                <h3 style={{margin: "0 0 8px", fontSize: "22px", letterSpacing: "0"}}>
                                    Youth are our bosses
                                </h3>
                                <p style={{margin: 0, color: "rgba(255,255,255,0.86)", lineHeight: 1.45}}>
                                    A guide for exploring tools, materials, and projects inside the makerspace.
                                </p>
                            </div>
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gap: "16px",
                            }}
                        >
                            <div
                                style={{
                                    background: "var(--viventory-welcome-card)",
                                    border: "1px solid var(--viventory-border)",
                                    borderRadius: "8px",
                                    padding: "22px",
                                    textAlign: "left",
                                    backdropFilter: "blur(12px)",
                                }}
                            >
                                <h2
                                    style={{
                                        margin: "0 0 14px",
                                        color: "var(--viventory-text)",
                                        fontSize: "28px",
                                        fontWeight: 800,
                                        letterSpacing: "0",
                                    }}
                                >
                                    Make, test, share
                                </h2>
                                <p style={{margin: 0, color: "var(--viventory-muted-text)", lineHeight: 1.45}}>
                                    Viventory connects the physical workshop to a digital inventory, so makers can quickly see what is available.
                                </p>
                            </div>
                            <div
                                style={{
                                    background: "var(--viventory-welcome-accent)",
                                    borderRadius: "8px",
                                    padding: "22px",
                                    color: "#1f1300",
                                    textAlign: "left",
                                }}
                            >
                                <div style={{fontSize: "38px", fontWeight: 850, lineHeight: 1}}>
                                    10
                                </div>
                                <p style={{margin: "8px 0 0", color: "#1f1300", fontWeight: 750}}>
                                    Kampong Eunos
                                </p>
                            </div>
                            <div
                                style={{
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    minHeight: "132px",
                                }}
                            >
                                <img
                                    src={vivitaCommunityImage}
                                    alt="VIVITA youth community"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            </div>
                        </div>
                    </aside>
                </main>
                <footer
                    style={{
                        width: "100%",
                        background: "var(--viventory-welcome-footer)",
                        padding: "18px 24px",
                        display: "flex",
                        justifyContent: "left",
                        alignItems: "center",
                        gap: "20px",
                        boxSizing: "border-box",
                        minHeight: "58px",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <h4 style={{
                        color: "white",
                        fontSize: "16px",
                        fontWeight: 650,
                        margin: 0,
                    }}>
                        team gurt x vivita
                    </h4>

                    <div style={{flexGrow:"1",}}/>
                    <button
                        onClick={() => {
                            openTab("Settings", () => new Settings());
                        }}
                        style={buttonStyle()}
                    >
                        <BsGearFill /> Settings
                    </button>

                    <button
                        onClick={() => {
                            openTab("Documentation", () => new DocsView());
                        }}
                        style={buttonStyle()}
                    >
                        <IoIosBook /> Docs
                    </button>
                </footer>
            </div>)
    }
}
//@ts-ignore
type RenderTabBarTabProps = {
    tab:Tab;
    index:number;
    onClose:(index: number) => void;
    currentTabIndex:number;
    setTabIndex:(index: number) => void;
    moveTab:(from:number,to:number)=>void;
    tabsLength:number;  
}

// @ts-ignore

function RenderTabBarTab({
                             tab,
                             index,
                             onClose,
                             currentTabIndex,
                             setTabIndex
                         }: RenderTabBarTabProps) {
    const [isHovered, setIsHovered] = useState(false)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: tab.id
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        width: "190px",
        padding: "7px 14px",
        borderRadius: "10px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background:
            index === currentTabIndex
                ? "var(--viventory-active-tab)"
                : "var(--viventory-tab)",
        color: "var(--viventory-text)",
        border:
            index === currentTabIndex
                ? "2px solid var(--viventory-tab-active-border)"
                : "1px solid var(--viventory-border)",
        boxShadow:
            index === currentTabIndex
                ? "0 10px 22px rgba(15, 23, 42, 0.14)"
                : "none",
        fontWeight: index === currentTabIndex ? 750 : 650,

        userSelect: "none" as const,

        cursor: isDragging
            ? "grabbing"
            : "grab",

        flexShrink: 0,

        zIndex: isDragging ? 1000 : 1,

        opacity: isDragging ? 0.9 : 1
    }
    // @ts-ignore
    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => setTabIndex(index)}
        >
            <div
                {...listeners}
                style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    cursor: "grab",
                    display: "flex",
                    alignItems: "center"
                }}
            >
                {tab.name}
            </div>

            <button
                onPointerDown={(e) => e.stopPropagation()}

                onMouseEnter={() => setIsHovered(true)}

                onMouseLeave={() => setIsHovered(false)}

                onClick={(e) => {

                    e.stopPropagation()

                    onClose(index)
                }}

                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                        isHovered
                            ? "rgba(255,255,255,0.7)"
                            : "transparent",
                    borderRadius: "100%",
                    border: "1.5px solid transparent",
                    padding: "5px",
                    cursor: "pointer",
                    marginLeft: "5px",
                }}
            >
                {
                    isHovered
                        ? <IoIosCloseCircle size={20} color="currentColor" />
                        : <IoIosCloseCircleOutline size={20} color="currentColor" />
                }
            </button>
        </div>
    )
}
type RenderTabBarProps = {
    tabs: Tab[]
    setTabs: React.Dispatch<React.SetStateAction<Tab[]>>
    onClose: (index: number) => void
    currentTabIndex: number
    setTabIndex: React.Dispatch<React.SetStateAction<number>>
    handleNewTab: () => number
    moveTab: (from: number, to: number) => void
}

function RenderTabBar({
              tabs,
              setTabs,
              onClose,
              currentTabIndex,
              setTabIndex,
              handleNewTab,
              moveTab
          }: RenderTabBarProps): React.ReactElement {

    const [isHovered, setIsHovered] = useState(false)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )
    return (
        <DndContext
            sensors={sensors}

            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={(event) => {

                const { active, over } = event

                if (!over || active.id === over.id) return

                const oldIndex =
                    tabs.findIndex(
                        t => t.id === active.id
                    )

                const newIndex =
                    tabs.findIndex(
                        t => t.id === over.id
                    )

                setTabs((items) =>
                    arrayMove(items, oldIndex, newIndex)
                )

                if (currentTabIndex === oldIndex) {
                    setTabIndex(newIndex)
                }
            }}
        >
            <SortableContext
                items={tabs.map(t => t.id)}

                strategy={horizontalListSortingStrategy}
            >
                <div
                    style={{
                        borderRadius: "0px",
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        padding: "8px 10px",
                        height: "54px",
                        gap: "8px",
                        overflowX: "scroll",
                        scrollbarWidth:"thin",
                        scrollbarGutter:"unset",
                        overflowY: "hidden",
                        background: "var(--viventory-muted-surface)",
                        borderBottom: "1px solid var(--viventory-border)",
                        boxSizing: "border-box"
                    }}
                >
                    {
                        tabs.map((tab, index) => (
                            <RenderTabBarTab
                                key={tab.id}
                                tab={tab}
                                index={index}
                                onClose={onClose}
                                currentTabIndex={currentTabIndex}
                                setTabIndex={setTabIndex}
                                moveTab={moveTab}
                                tabsLength={tabs.length}
                            />
                        ))
                    }

                    <button
                        onMouseEnter={() => setIsHovered(true)}

                        onMouseLeave={() => setIsHovered(false)}

                        onClick={(e) => {

                            e.stopPropagation()

                            handleNewTab()
                        }}

                        style={{
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                                isHovered
                                    ? "var(--viventory-active-tab)"
                                    : "transparent",
                            borderRadius: "100%",
                            border: "1.5px solid var(--viventory-border)",
                            padding: "5px",
                            cursor: "pointer",
                            color: "var(--viventory-text)",
                        }}
                    >
                        {
                            isHovered
                                ? <MdAddCircle size={18} color="currentColor" />
                                : <MdAddCircleOutline size={18} color="currentColor" />
                        }
                    </button>
                </div>
            </SortableContext>
        </DndContext>
    )
}

function RenderTab(
    tabs: Tab[],
    tabIndex: number
): React.ReactElement {

    return (
        <div
            style={{
                flex: 1,
                borderRadius: "0px",
                overflow: "hidden",
                minHeight: 0
            }}
        >
            {
                tabs.length > 0 &&
                tabIndex >= 0 &&
                tabIndex < tabs.length
                    ? tabs[tabIndex].content
                    : null
            }
        </div>
    )
}

function AppCommandEntry({ setCmdBarVis }: { setCmdBarVis: (visible: boolean) => void }) {
    return (
        <div
            style={{
                minHeight: "42px",
                display: "grid",
                gridTemplateColumns: "minmax(120px, 1fr) minmax(260px, 520px) minmax(120px, 1fr)",
                alignItems: "center",
                padding: "6px 18px",
                boxSizing: "border-box",
                background: "linear-gradient(135deg, var(--viventory-shell-start) 0%, var(--viventory-shell-mid) 46%, var(--viventory-shell-end) 100%)",
                borderBottom: "1px solid var(--viventory-border)",
                color: "var(--viventory-shell-text)",
                flexShrink: 0,
            }}
        >
            <div />
            <button
                className="command-button"
                type="button"
                onClick={() => setCmdBarVis(true)}
                style={{
                    width: "100%",
                    justifyContent: "flex-start",
                }}
            >
                &gt; Enter command
            </button>
            <div />
        </div>
    );
}

function App() {

    const [cmdBarVis,setCmdBarVis] = useState<boolean>(false)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

    const [tabs, setTabs] = useState<Tab[]>([
        new welcomeTab(),
        new MakerKioskTab(),
        new RoomMapTab(),
        new UserViewTab()
    ])

    const [tabIndex, setTabIndex] = useState<number>(0)

    useEffect(() => {
        const savedPrefs = loadAppearancePrefs();
        applyAppearancePrefs(savedPrefs);

        const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
        const handleSystemThemeChange = () => {
            const currentPrefs = loadAppearancePrefs();
            if (currentPrefs.theme === "system") {
                applyAppearancePrefs(currentPrefs);
            }
        };

        mediaQuery?.addEventListener("change", handleSystemThemeChange);
        return () => mediaQuery?.removeEventListener("change", handleSystemThemeChange);
    }, []);

    const handleNewTab = (): number => {

        const newIndex = tabs.length

        setTabs((prev) => {
            return [...prev, new welcomeTab()]
        })

        setTabIndex(newIndex)

        return newIndex
    }

    const handleClosingTab:(index:number)=>void = (index: number) => {

        setTabs((prevTabs) => {

            const newTabs = prevTabs.filter((_, i) => i !== index)

            if (newTabs.length === 0) {
                setTabIndex(0)
                return [new welcomeTab()]
            }

            if (tabIndex >= newTabs.length) {
                setTabIndex(newTabs.length - 1)
            } else if (tabIndex === index) {
                setTabIndex(Math.max(0, index - 1))
            }

            return newTabs
        })
    }

    const moveTab = (from: number, to: number) => {

        setTabs((prev) => {

            const updated = [...prev]

            const [movedTab] = updated.splice(from, 1)

            updated.splice(to, 0, movedTab)

            return updated
        })

        setTabIndex(to)
    }

    const moveTabLeft = (index: number) => {

        if (index <= 0) return

        moveTab(index, index - 1)
    }

    const moveTabRight = (index: number) => {

        if (index >= tabs.length - 1) return

        moveTab(index, index + 1)
    }

    const setTab = (index: number, tab: Tab) => {

        setTabs((prev) => {

            const updated = [...prev]

            updated[index] = tab

            return updated
        })
    }

    const handleMaterialSearch = (query: string) => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            return;
        }

        const existingIndex = tabs.findIndex(tab => tab.name === "User View");

        if (existingIndex !== -1) {
            setTabIndex(existingIndex);
            window.setTimeout(() => {
                window.dispatchEvent(
                    new CustomEvent("viventory:material-search", {
                        detail: { query: trimmedQuery }
                    })
                );
            }, 0);
            return;
        }

        setTabs((prevTabs) => {
            setTabIndex(prevTabs.length);
            return [...prevTabs, new UserViewTab(trimmedQuery)];
        });
    }
    welcomeTab.SetProps(
        { tabs },
        {
            tabs,
            setTabs,
            tabIndex,
            setTabIndex,
            handleNewTab,
            setTab,
            handleClosingTab,
            handleMaterialSearch
        }
    )
    HelpCommand.receive({
        tabs,
        setTabs,
        tabIndex,
        setTabIndex,
        handleNewTab,
        setTab,
        handleClosingTab,
        handleMaterialSearch
    })
    SearchCommand.receive({
        tabs,
        setTabs,
        tabIndex,
        setTabIndex,
        handleNewTab,
        setTab,
        handleClosingTab,
        handleMaterialSearch
    })
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey && event.key === 'y') {
                setCmdBarVis((prev) => !prev);
            }

            if (event.metaKey && event.ctrlKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                void toggleFullscreen();
            }

            if (event.metaKey && event.key.toLowerCase() === 't') {
                event.preventDefault();
                handleNewTab();
            }

            if (event.metaKey && event.key.toLowerCase() === 'w') {
                event.preventDefault();
                handleClosingTab(tabIndex);
            }

            if (event.ctrlKey && event.key === 'Tab' && tabs.length > 0) {
                event.preventDefault();
                const direction = event.shiftKey ? -1 : 1;
                const nextIndex = (tabIndex + direction + tabs.length) % tabs.length;
                setTabIndex(nextIndex);
            }

            if (event.key === 'F11') {
                event.preventDefault();
                void toggleFullscreen();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleNewTab, handleClosingTab, isFullscreen, tabIndex, tabs.length]);

    const toggleFullscreen = async () => {
        try {
            const window = getCurrentWindow();
            const currentlyFullscreen = await window.isFullscreen();
            await window.setFullscreen(!currentlyFullscreen);
            setIsFullscreen(!currentlyFullscreen);
        } catch (error) {
            console.warn("Fullscreen is only available in the Tauri desktop app.", error);
        }
    };
    return (
        <InventoryProvider>
        <main
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "0px",
                height: "100vh",
                width: "100vw",
                overflow: "hidden",
                boxSizing: "border-box",
                background: "var(--viventory-bg)",
                color: "var(--viventory-text)",
                fontSize: "var(--viventory-font-size)",
            }}
        >
            {cmdBarVis && <CommandBar setVisibility={setCmdBarVis} />}

            {!isFullscreen && <Titlebar
                    tabs={tabs}
                    setTabIndex={setTabIndex}
                    handleNewTab={handleNewTab}
                    setTab={setTab}
                    onToggleFullscreen={toggleFullscreen}
                />}
            <AppCommandEntry setCmdBarVis={setCmdBarVis} />
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                <RenderTabBar
                    tabs={tabs}
                    setTabs={setTabs}
                    onClose={handleClosingTab}
                    currentTabIndex={tabIndex}
                    setTabIndex={setTabIndex}
                    handleNewTab={handleNewTab}
                    moveTab={moveTab}
                />

                {RenderTab(tabs, tabIndex)}
            </div>
        </main>
        </InventoryProvider>
    )
}

export default App

//@ts-ignore
ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
