import fs from "node:fs";
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
export class File {
    path: string;
    contents:string | undefined = "";
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
            console.log(result)
            this.contents = result;
        } catch (e) {
            this.contents = undefined;
            this.err = `${e}`;
            console.error(this.err)
            console.log(this.contents)
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
            </h3>
        </div>);
    }
}