import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { loadDocsMarkdownFileContent } from "./Docs/docsFileApi"
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
            this.contents = await loadDocsMarkdownFileContent(this.path);
        } catch (e) {
            this.contents = undefined;
            this.err = `${e}`;
            console.error(`Failed to load ${this.path}: ${this.err}`)
        }
    }
}

export function renderMdFile(file:File):React.ReactElement{
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
