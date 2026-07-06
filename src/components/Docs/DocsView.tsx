import { ReactNode } from "react"
import { Tab } from "../../types"
import { File, renderMdFile } from "../FileHelper"
import { useState, useEffect } from "react"
import { getDocsMarkdownFiles } from "./docsFileApi"

class DocsView implements Tab {
    id: string = crypto.randomUUID()
    name: string = "Documentation"
    content: ReactNode

    constructor() {
        this.content = <DocsContent />
    }
}

function DocsContent() {
    const [files, setFiles] = useState<File[]>([])
    const [selected, setSelected] = useState<number>(0)
    const [query, setQuery] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadFiles() {
            try {
                setLoading(true)
                setError("")

                const paths = await getDocsMarkdownFiles()
                const fileObjects = await Promise.all(paths.map(path => File.create(path)))

                setFiles(fileObjects)

                if (fileObjects.length === 0) {
                    setError("No documentation files were found.")
                }
            } catch (err) {
                setFiles([])
                setError(`Unable to load documentation: ${err}`)
            } finally {
                setLoading(false)
            }
        }

        loadFiles()
    }, [])

    const filtered = files.filter(file => {
        const name = file.path.split("/").pop()?.replace(/\.md$/, "") || ""
        return name.toLowerCase().includes(query.toLowerCase())
    })

    useEffect(() => {
        if (selected >= filtered.length) {
            setSelected(0)
        }
    }, [query, files])

    return (
        <div style={{
            display: "flex",
            height: "100%",
            fontFamily: "monospace",
            background: "#ffffff",
            color: "#111111"
        }}>
            <div style={{
                width: "240px",
                borderRight: "1px solid #e5e5e5",
                padding: "10px",
                overflowY: "auto",
                background: "#fafafa",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
            }}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    style={{
                        padding: "6px 8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        outline: "none",
                        fontFamily: "monospace",
                        fontSize: "12px"
                    }}
                />

                <div style={{ display: "flex", flexDirection: "column" }}>
                    {filtered.map((file, index) => {
                        const name = file.path.split("/").pop()?.replace(/\.md$/, "") || ""
                        const active = index === selected

                        return (
                            <div
                                key={index}
                                onClick={() => setSelected(index)}
                                style={{
                                    padding: "6px 8px",
                                    marginBottom: "4px",
                                    cursor: "pointer",
                                    borderRadius: "4px",
                                    background: active ? "#eaeaea" : "transparent",
                                    border: active ? "1px solid #d0d0d0" : "1px solid transparent"
                                }}
                            >
                                {name}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div style={{
                flex: 1,
                padding: "18px 26px",
                overflowY: "auto",
                background: "#ffffff"
            }}>
                {loading ? (
                    <div>Loading documentation...</div>
                ) : error ? (
                    <div style={{
                        color: "#b00020",
                        background: "#fff5f5",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #ffc9c9"
                    }}>
                        {error}
                    </div>
                ) : filtered[selected] && (
                    filtered[selected].err ? (
                        <div style={{
                            color: "#b00020",
                            background: "#fff5f5",
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid #ffc9c9"
                        }}>
                            {filtered[selected].err}
                        </div>
                    ) : (
                        renderMdFile(filtered[selected])
                    )
                )}
            </div>
        </div>
    )
}
export default DocsView;
