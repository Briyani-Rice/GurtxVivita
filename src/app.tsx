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
    onRun: () => void = ()=>{}
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
        // useEffect(() => {
        //     document.addEventListener('keydown',(_)=>{
        //
        //     })
        // }, []);
        return(

            <div
                style={{
                    height: "100%",
                    width: "100%",
                    position: "relative",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingRight: "20%",
                    paddingLeft: "20%",
                    backgroundImage: "radial-gradient(gray 1px, transparent 1px)",
                    backgroundSize: "16px 16px"
                }}
            >
                <div>
                    <h1 style={{
                        margin: 0,
                        marginBottom: "50px",
                        fontSize: "100px",
                        fontWeight: 625,
                        color: "#3b83a3",
                    }}>
                        Viventory
                    </h1>
                    <h2 style={{
                        margin: 0,
                        marginBottom: "50px",
                        fontSize: "25px",
                        fontWeight: 625,
                        color: "#555555",
                    }}>
                        Enter text below to search.
                    </h2>
                    <input
                        type="search"
                        placeholder="Search..."
                        onKeyDown={(event) => {
                            if (event.key !== "Enter") {
                                return;
                            }

                            welcomeTab.props.handleMaterialSearch(event.currentTarget.value);
                        }}
                        style={{
                            width: "100%",
                            height: "50px",
                            padding: "22px",
                            fontSize: "15px",
                            fontWeight: "500",
                            fontFamily: "Libre Franklin, sans-serif",
                            border: "none",
                            borderRadius: "20px",
                            background: "#000000",
                            color: "#ffffff",
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "all 120ms ease",
                        }}
                    />
                </div>
                <footer
                    style={{
                        position: "absolute",
                        bottom: "0",
                        left: "0",
                        width: "100%",
                        background: "#3b83a3",
                        padding: "20px 20px",
                        display: "flex",
                        justifyContent: "left",
                        alignItems: "center",
                        gap: "20px",
                        boxSizing: "border-box",
                        height: "10px"
                    }}
                >
                    <h4 style={{
                        color: "white",
                        fontSize: "15px",
                        fontWeight: "375"
                    }}>
                        team gurt x vivita
                    </h4>

                    <div style={{flexGrow:"1",}}/>
                    <button
                        onClick={() => {
                            const existingIndex = welcomeTab.props.tabs.findIndex(
                                tab => tab.name === "Settings"
                            );

                            if (existingIndex !== -1) {
                                welcomeTab.props.setTabIndex(existingIndex);
                            } else {
                                const newIndex = welcomeTab.props.handleNewTab();
                                welcomeTab.props.setTab(newIndex, new Settings());
                            }
                        }}
                    >
                        <BsGearFill /> Settings
                    </button>

                    <button
                        onClick={() => {
                            const existingIndex = welcomeTab.props.tabs.findIndex(
                                tab => tab.name === "Documentation"
                            );

                            if (existingIndex !== -1) {
                                welcomeTab.props.setTabIndex(existingIndex);
                            } else {
                                const newIndex = welcomeTab.props.handleNewTab();
                                welcomeTab.props.setTab(newIndex, new DocsView());
                            }
                        }}
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
        width: "180px",
        padding: "5px 15px",
        borderRadius: "10px",
        height: "25px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background:
            index === currentTabIndex
                ? "#cce8f4"
                : "#dddddd",

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
                            ? "#ffffff75"
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
                        ? <IoIosCloseCircle size={20} color="black" />
                        : <IoIosCloseCircleOutline size={20} color="black" />
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
                        padding: "5px",
                        height: "45px",
                        gap: "5px",
                        overflowX: "scroll",
                        scrollbarWidth:"thin",
                        scrollbarGutter:"unset",
                        overflowY: "hidden",
                        background: "#00000010",
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
                                    ? "#00000025"
                                    : "transparent",
                            borderRadius: "100%",
                            border: "1.5px solid transparent",
                            padding: "5px",
                            cursor: "pointer",
                        }}
                    >
                        {
                            isHovered
                                ? <MdAddCircle size={18} color="black" />
                                : <MdAddCircleOutline size={18} color="black" />
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

function App() {

    const [cmdBarVis,setCmdBarVis] = useState<boolean>(false)

    const [tabs, setTabs] = useState<Tab[]>([
        new welcomeTab(),
        new RoomMapTab(),
        new UserViewTab()
    ])

    const [tabIndex, setTabIndex] = useState<number>(0)

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
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey && event.key === 'y') {
                setCmdBarVis((prev) => !prev);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
    return (
        <main
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "0px",
                height: "100vh",
                width: "100vw",
                overflow: "hidden",
                boxSizing: "border-box"
            }}
        >
            {cmdBarVis && <CommandBar setVisibility={setCmdBarVis} />}

            <Titlebar
                tabs={tabs}
                setTabIndex={setTabIndex}
                handleNewTab={handleNewTab}
                setTab={setTab}
                setCmdBarVis={setCmdBarVis}
            />
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
    )
}

export default App

//@ts-ignore
ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
