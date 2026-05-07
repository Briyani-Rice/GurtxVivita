import fs from "node:fs";
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
export class File {
    path: string;
    contents:string = "";
    err: string = "";

    private constructor(path: string) { this.path = path; }
    static async create(path: string): Promise<File> {
        const file = new File(path);
        await file.refresh();
        return file;
    }

    async refresh(): Promise<void> {
        try {
            const result = await window.electron?.loadFileContent(this.path);
            if (result.success) {
                this.contents = result.content;
                this.err = "";
            } else {
                this.contents = undefined;
                this.err = result.error;
            }
        } catch (e) {
            this.contents = undefined;
            this.err = `Unexpected error: ${e}`;
        }
    }
}

export function renderMdFile(file:File):React.ReactElement{
    console.log(file.contents)
    if (file.contents){
        return(<ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
        >
            {file.contents}
        </ReactMarkdown>);
    }else{
        return(<div>
            <h3>
                Unable to render mark down file!
                {
                    console.log(file.contents)
                }
            </h3>
        </div>);
    }
}