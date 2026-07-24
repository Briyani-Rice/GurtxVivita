//@ts-ignore
import React, {useCallback, useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom/client'
//@ts-ignore
import './style.css'
import Titlebar from "./titlebar"
import {Command, CommandArgument, Tab, UserPerms} from "./types"
import "react-icons/io"
import {IoIosCloseCircle, IoIosCloseCircleOutline} from 'react-icons/io'
import {MdAddCircle, MdAddCircleOutline} from "react-icons/md";
import {arrayMove, horizontalListSortingStrategy, SortableContext, useSortable} from "@dnd-kit/sortable"

import {CSS} from "@dnd-kit/utilities"
import {closestCenter, DndContext, PointerSensor, useSensor, useSensors} from "@dnd-kit/core";
import {restrictToHorizontalAxis} from "@dnd-kit/modifiers";
import Settings from "./components/Settings/Settings";
import DocsView from "./components/Docs/DocsView";
import {CommandBar} from "./CommandBar";
import LoginTab from "./components/LoginTab";
import {UserViewTab} from "./components/UserViewTab";
import { applyAppearancePrefs, loadAppearancePrefs } from "./components/Settings/appearancePreferences";
import { MakerKioskTab } from "./components/MakerKiosk";
import vivitaLogo from "./assets/vivita-logo.png";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { InventoryProvider } from "./components/InventoryProvider";
import AdminViewTab from "./components/AdminViewTab";
import { consumeGoogleRedirectResult } from "./services/firebaseAuth";
import { recordAccountLogin } from "./services/accountSession";
import { translateTabName, useI18n } from "./i18n/i18n";
import {platform} from "@tauri-apps/plugin-os";
import {FaHome, FaRobot} from "react-icons/fa";
import {FaGear} from "react-icons/fa6";

export type BasicTabProps = {
    tabs: Tab[];
    setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
    tabIndex: number;
    setTabIndex: (index: number) => void;
    handleNewTab: () => number;
    setTab: (index: number, tab: Tab) => void;
    handleClosingTab: (index: number) => void;
    handleMaterialSearch: (query: string) => void;
}

let commandTabProps: BasicTabProps | undefined

export function focusOrOpenTab(name: string, tabFactory: () => Tab): void {
    const bt = commandTabProps
    if (!bt) return

    const existingIndex = bt.tabs.findIndex(tab => tab.name === name)

    if (existingIndex !== -1) {
        bt.setTabIndex(existingIndex)
        return
    }

    const newIndex = bt.handleNewTab()
    bt.setTab(newIndex, tabFactory())
}

export class SearchCommand implements Command {
    id: string = crypto.randomUUID()
    args: CommandArgument[] = []
    name: string = "Welcome"
    onRun: () => void = () => focusOrOpenTab("Welcome", () => new welcomeTab())
    static bt:BasicTabProps
    static receive (bt0: BasicTabProps):void{
        SearchCommand.bt=bt0;
        commandTabProps=bt0;
    }
}

export class OpenTabCommand implements Command {
    id: string = crypto.randomUUID()
    args: CommandArgument[] = []
    name: string
    onRun: () => void

    constructor(name: string, tabName: string, tabFactory: () => Tab) {
        this.name = name
        this.onRun = () => focusOrOpenTab(tabName, tabFactory)
    }
}

export class LoginCommand implements Command {
    id: string = crypto.randomUUID()
    args: CommandArgument[] = []
    name: string = "Login"
    onRun: () => void = ()=>{
        const bt = commandTabProps
        if (!bt) return

        const existingIndex = bt.tabs.findIndex(tab => tab.name === "Login")

        if (existingIndex !== -1) {
            bt.setTabIndex(existingIndex)
            return
        }

        const newIndex = bt.handleNewTab()
        bt.setTab(newIndex, new LoginTab(bt, newIndex))
    }
}

export var commands:Command[] = [
    new SearchCommand(),
    new OpenTabCommand("Maker Bot", "Maker Bot", () => new MakerKioskTab()),
    new OpenTabCommand("Inventory", "User View", () => new UserViewTab()),
    new OpenTabCommand("Docs", "Documentation", () => new DocsView()),
    new OpenTabCommand("Settings", "Settings", () => new Settings()),
    new LoginCommand(),
]

export class welcomeTab implements Tab {

    id = crypto.randomUUID()
    name: string = "Welcome"
    content: React.ReactNode
    static props:BasicTabProps

    constructor() {
        this.content = <WelcomeContent />
    }
    static SetProps(_: { tabs: Tab[] }, basicTabProps: BasicTabProps){
        this.props = basicTabProps
    }
}

function WelcomeContent() {
    const { t } = useI18n();
    const searchInputId = "welcome-search";

    const quickLinks: Array<{ label: string; open: () => void }> = [
        { label: t("link.makerBot"), open: () => focusOrOpenTab("Maker Bot", () => new MakerKioskTab()) },
        { label: t("link.inventory"), open: () => focusOrOpenTab("User View", () => new UserViewTab()) },
        { label: t("link.docs"), open: () => focusOrOpenTab("Documentation", () => new DocsView()) },
        { label: t("link.settings"), open: () => focusOrOpenTab("Settings", () => new Settings()) },
    ];

    return(

        <div
            style={{
                height: "100%",
                width: "100%",
                boxSizing: "border-box",
                background: "var(--viventory-welcome-bg)",
                color: "var(--viventory-text)",
                overflow: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(24px, 6vw, 64px)",
            }}
        >
            <main
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: "22px",
                }}
            >
                <img
                    src={vivitaLogo}
                    alt="VIVITA"
                    style={{
                        width: "170px",
                        height: "auto",
                        display: "block",
                        filter: "var(--viventory-logo-filter)",
                    }}
                />
                <h1 style={{
                    margin: 0,
                    fontSize: "clamp(30px, 4.5vw, 42px)",
                    lineHeight: 1.1,
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                    color: "var(--viventory-text)",
                }}>
                    {t("welcome.heading")}
                </h1>
                <p style={{
                    margin: 0,
                    maxWidth: "420px",
                    fontSize: "16px",
                    lineHeight: 1.5,
                    color: "var(--viventory-muted-text)",
                }}>
                    {t("welcome.sub")}
                </p>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        const input = event.currentTarget.elements.namedItem(searchInputId) as HTMLInputElement | null;
                        welcomeTab.props.handleMaterialSearch(input?.value ?? "");
                    }}
                    style={{
                        width: "100%",
                    }}
                >
                    <input
                        id={searchInputId}
                        name={searchInputId}
                        type="search"
                        placeholder={t("welcome.searchPlaceholder")}
                        style={{
                            width: "100%",
                            minHeight: "48px",
                            padding: "0 16px",
                            fontSize: "15px",
                            border: "1px solid var(--viventory-border)",
                            borderRadius: "8px",
                            background: "var(--viventory-surface)",
                            color: "var(--viventory-text)",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </form>
                <nav
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: "4px 22px",
                    }}
                >
                    {quickLinks.map(link => (
                        <button
                            key={link.label}
                            onClick={link.open}
                            style={{
                                background: "none",
                                border: "none",
                                padding: "6px 0",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "var(--viventory-welcome-accent)",
                                cursor: "pointer",
                            }}
                        >
                            {link.label}
                        </button>
                    ))}
                </nav>
                <p style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "var(--viventory-muted-text)",
                }}>
                    {t("welcome.hint")}
                </p>
            </main>
        </div>)
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
    const { language } = useI18n()

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
                {translateTabName(language, tab.name)}
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

function RenderMobileTabBar({
                                tabs,
                                setTabs,
                                tabIndex,
                                setTabIndex,
                                handleNewTab,
                                setTab,
                                handleClosingTab,
                                handleMaterialSearch}:BasicTabProps):React.ReactElement{

    const currentName = tabs[tabIndex]?.name

    const openOrFocus = (name: string, factory: () => Tab) => {
        const existingIndex = tabs.findIndex(tab => tab.name === name)

        if (existingIndex !== -1) {
            setTabIndex(existingIndex)
            return
        }

        const newIndex = handleNewTab()
        setTab(newIndex, factory())
    }

    const navButtonStyle = (active: boolean): React.CSSProperties => ({
        padding: "10px 20px",
        background: "none",
        border: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        color: active ? "var(--viventory-welcome-accent)" : "inherit",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
    })

    return (
        <div style={{
            position: "fixed",
            bottom: "16px",
            left: "10%",
            width: "80%",
            height: "60px",
            zIndex: 10,
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(10px)",
            borderRadius: "30px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
        }}>
            <button
                style={navButtonStyle(currentName === "Welcome")}
                onClick={() => openOrFocus("Welcome", () => new welcomeTab())}
            >
                <FaHome/>
                Home
            </button>
            <button
                style={navButtonStyle(currentName === "Maker Bot")}
                onClick={() => openOrFocus("Maker Bot", () => new MakerKioskTab())}
            >
                <FaRobot />
                MakerBot
            </button>
            <button
                style={navButtonStyle(currentName === "Settings")}
                onClick={() => openOrFocus("Settings", () => new Settings())}
            >
                <FaGear />
                Settings
            </button>
        </div>)
}
function RenderTab(
    tabs: Tab[],
    tabIndex: number,
    mobile: boolean = false
): React.ReactElement {

    return (
        <div
            style={
                mobile
                    // Let this grow with its content — it lives inside a
                    // scrollable ancestor now, so it must NOT clip
                    // (overflow:hidden) or zero its min size (minHeight:0),
                    // both of which would force it back to the container's
                    // fixed height and re-introduce the clipping bug.
                    ? {
                        flex: "none",
                        borderRadius: "0px",
                        overflow: "visible",
                        minHeight: "100%",
                    }
                    : {
                        flex: 1,
                        borderRadius: "0px",
                        overflow: "hidden",
                        minHeight: 0
                    }
            }
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
    const { t } = useI18n();
    return (
        <div
            style={{
                minHeight: "42px",
                display: "grid",
                gridTemplateColumns: "minmax(120px, 1fr) minmax(260px, 520px) minmax(120px, 1fr)",
                alignItems: "center",
                padding: "6px 18px",
                boxSizing: "border-box",
                background: "var(--viventory-shell-start)",
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
                &gt; {t("app.enterCommand")}
            </button>
            <div />
        </div>
    );
}

function App() {

    const [cmdBarVis,setCmdBarVis] = useState<boolean>(false)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

    const [tabs, setTabs] = useState<Tab[]>([
        new welcomeTab()
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

    useEffect(() => {
        let cancelled = false;

        consumeGoogleRedirectResult().then((result) => {
            if (cancelled || !result) {
                return;
            }

            if (!result.success) {
                console.warn(result.note);
                alert(`Google sign-in failed: ${result.note}`);
                return;
            }

            const isAdmin = result.perms === UserPerms.Staff;
            const targetName = isAdmin ? "Admin View" : "User View";
            recordAccountLogin({
                label: result.displayName || result.email || "Google account",
                email: result.email,
                provider: "google",
                perms: result.perms,
            });

            setTabs((prevTabs) => {
                const existingIndex = prevTabs.findIndex((tab) => tab.name === targetName);

                if (existingIndex !== -1) {
                    setTabIndex(existingIndex);
                    return prevTabs;
                }

                const nextTab: Tab = isAdmin ? new AdminViewTab() : new UserViewTab();
                setTabIndex(prevTabs.length);
                return [...prevTabs, nextTab];
            });
        });

        return () => {
            cancelled = true;
        };
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
    const openLoginTab = useCallback(() => {
        const existingIndex = tabs.findIndex(tab => tab.name === "Login");

        if (existingIndex !== -1) {
            setTabIndex(existingIndex);
            return;
        }

        const newIndex = handleNewTab();
        setTab(
            newIndex,
            new LoginTab({
                tabs,
                setTabs,
                tabIndex,
                setTabIndex,
                handleNewTab,
                setTab,
                handleClosingTab,
                handleMaterialSearch,
            }, newIndex),
        );
    }, [handleClosingTab, handleMaterialSearch, handleNewTab, setTab, tabIndex, tabs]);

    useEffect(() => {
        const onOpenLogin = () => openLoginTab();

        window.addEventListener("viventory:open-login", onOpenLogin);
        return () => window.removeEventListener("viventory:open-login", onOpenLogin);
    }, [openLoginTab]);

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

            if (
                event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey &&
                /^[1-9]$/.test(event.key) && tabs.length > 0
            ) {
                event.preventDefault();
                const digit = Number(event.key);
                const targetIndex = digit === 9 ? tabs.length - 1 : digit - 1;
                if (targetIndex < tabs.length) {
                    setTabIndex(targetIndex);
                }
            }

            if (
                event.metaKey && event.shiftKey &&
                (event.code === 'BracketRight' || event.code === 'BracketLeft') &&
                tabs.length > 0
            ) {
                event.preventDefault();
                const direction = event.code === 'BracketRight' ? 1 : -1;
                setTabIndex((tabIndex + direction + tabs.length) % tabs.length);
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
            {(platform()=="android"||platform()=="ios")?
                <main
                    className="app-shell"
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
                    }}>
                    {/*
                        This wrapper must be a flex container itself, or the
                        child's flex:1/minHeight:0 below do nothing and the
                        content silently gets clipped by this <main>'s
                        overflow:hidden with no way to scroll.
                    */}
                    <div style={{
                        position: "relative",
                        flex: 1,
                        minHeight: 0,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}>
                        <div
                            style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: "auto",
                                overflowX: "hidden",
                                WebkitOverflowScrolling: "touch",
                                display: "flex",
                                flexDirection: "column",
                                // Clearance so scrolled content never renders
                                // behind/through the floating nav bar below
                                // (fixed bottom:16 + height:60). This lives
                                // here, not in each Tab, so every tab gets
                                // it automatically.
                                paddingBottom: "92px",
                                boxSizing: "border-box",
                            }}
                        >
                            {RenderTab(tabs, tabIndex, true)}
                        </div>

                        <RenderMobileTabBar
                            tabs={tabs}
                            setTabs={setTabs}
                            tabIndex={tabIndex}
                            setTabIndex={setTabIndex}
                            handleNewTab={handleNewTab}
                            setTab={setTab}
                            handleClosingTab={handleClosingTab}
                            handleMaterialSearch={handleMaterialSearch}
                        />
                    </div>
                </main>:
                <main
                    className="app-shell"
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
                </main>}
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