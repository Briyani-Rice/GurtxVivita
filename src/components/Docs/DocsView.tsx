import { ReactNode } from "react"
import { Tab } from "../../types"
import {File, renderMdFile} from "../FileHelper"
import React, { useState, useEffect } from "react"

export default class DocsView implements Tab {
    id: string = crypto.randomUUID()
    name: string = "Documentation"
    content: ReactNode

    constructor() {
        this.content = <DocsContent />
    }
}
function DocsContent() {
    const [files, setFiles] = useState<File[]>([])

    useEffect(() => {
        async function loadFiles() {
            // Step 1: Get paths from main process
            const paths: string[] = await window.electron?.getMdFiles(); // use electronAPI from preload
            console.log(paths)
            const fileObjects: File[] = await Promise.all(paths.map(path => File.create(path)));
            await Promise.all(fileObjects.map(file => file.ready));
            setFiles(fileObjects);
        }

        loadFiles();
    }, [])

    return (
        <div>
            <div>
                {files.map((file, index) => {
                    console.log("Path:"+file.path)
                    return (
                        <p key={index}>{(file.path.split("/").pop()).replace(/\.md$/, "")}</p>
                    )
                })}
            </div>
            <div>
                {files.map((file, index) => (
                    <div key={index}>
                        {file.err ? (
                            <p style={{ color: "red" }}>{file.err}</p>
                        ) : (
                            renderMdFile(file)
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}