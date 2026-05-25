// Template code:
// import './style.css'
// import typescriptLogo from './assets/typescript.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
// import { setupCounter } from './counter.ts'
//
// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
// <section id="center">
//   <div class="hero">
//     <img src="${heroImg}" class="base" width="170" height="179">
//     <img src="${typescriptLogo}" class="framework" alt="TypeScript logo"/>
//     <img src="${viteLogo}" class="vite" alt="Vite logo" />
//   </div>
//   <div>
//     <h1>Get started</h1>
//     <p>Edit <code>src/main.ts</code> and save to test <code>HMR</code></p>
//   </div>
//   <button id="counter" type="button" class="counter"></button>
// </section>
//
// <div class="ticks"></div>
//
// <section id="next-steps">
//   <div id="Docs">
//     <svg class="icon" role="presentation" aria-hidden="true"><use href="/icons.svg#documentation-icon"></use></svg>
//     <h2>Documentation</h2>
//     <p>Your questions, answered</p>
//     <ul>
//       <li>
//         <a href="https://vite.dev/" target="_blank">
//           <img class="logo" src="${viteLogo}" alt="" />
//           Explore Vite
//         </a>
//       </li>
//       <li>
//         <a href="https://www.typescriptlang.org" target="_blank">
//           <img class="button-icon" src="${typescriptLogo}" alt="">
//           Learn more
//         </a>
//       </li>
//     </ul>
//   </div>
//   <div id="social">
//     <svg class="icon" role="presentation" aria-hidden="true"><use href="/icons.svg#social-icon"></use></svg>
//     <h2>Connect with us</h2>
//     <p>Join the Vite community</p>
//     <ul>
//       <li><a href="https://github.com/vitejs/vite" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#github-icon"></use></svg>GitHub</a></li>
//       <li><a href="https://chat.vite.dev/" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#discord-icon"></use></svg>Discord</a></li>
//       <li><a href="https://x.com/vite_js" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#x-icon"></use></svg>X.com</a></li>
//       <li><a href="https://bsky.app/profile/vite.dev" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#bluesky-icon"></use></svg>Bluesky</a></li>
//     </ul>
//   </div>
// </section>
//
// <div class="ticks"></div>
// <section id="spacer"></section>
// `
//
// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
//@ts-ignore
import React, {useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
//@ts-ignore
import './style.css'
import Titlebar from "./titlebar"
import { Tab } from "./types"
import "react-icons/io"
import {IoIosBook, IoIosCloseCircle, IoIosCloseCircleOutline} from 'react-icons/io'
import { MdAddCircle, MdAddCircleOutline } from "react-icons/md";
import { BsGearFill } from "react-icons/bs";
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    useSortable
} from "@dnd-kit/sortable"

import {
    CSS
} from "@dnd-kit/utilities"
import {closestCenter, DndContext, PointerSensor, useSensor, useSensors} from "@dnd-kit/core";
import {restrictToHorizontalAxis} from "@dnd-kit/modifiers";
import Settings from "./components/Settings/Settings";
import DocsView from "./components/Docs/DocsView";

export type BasicTabProps = {
    tabs:Tab[];
    setTabs:(tabs:Tab[])=>void;
    tabIndex:number;
    setTabIndex:(index:number)=>void;
    handleNewTab:()=>number;
    setTab: (index: number, tab: Tab) => void;
    handleClosingTab:(index:number)=>void;
}

export class welcomeTab implements Tab {

    id = crypto.randomUUID()
    name: string = "Welcome"
    content: React.ReactNode
    static props:BasicTabProps

    constructor() {
        this.content = (
            
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
            </div>
        )
    }
    static SetProps(p0: { tabs: Tab[] }, basicTabProps: BasicTabProps){
        this.props = basicTabProps
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

    const [tabs, setTabs] = useState<Tab[]>([
        new welcomeTab()
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
    welcomeTab.SetProps(
        { tabs },
        {
            tabs,
            setTabs,
            tabIndex,
            setTabIndex,
            handleNewTab,
            setTab,
            handleClosingTab
        }
    )
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
            <Titlebar
                tabs={tabs}
                setTabIndex={setTabIndex}
                handleNewTab={handleNewTab}
                setTab={setTab}
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