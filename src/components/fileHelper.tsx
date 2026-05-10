import fs from "node:fs";
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

export class File{
    path:string;
    contents: string | undefined;
    constructor(path:string){
        this.path = path;
        fs.readFile(path,'utf8',(err,data)=>{
            if (err){
                alert(`Unable to open file: ${path}\nERR: ${err}`)
            }else{
                this.contents = data;
            }
        })
    }
    refresh(){
        fs.readFile(this.path,'utf8',(err,data)=>{
            if (err){
                alert(`Unable to open file: ${this.path}\nERR: ${err}`)
            }else{
                this.contents = data;
            }
        })
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
        file.refresh()
        return(<div>
            <h3>
                Unable to render mark down file!
            </h3>
        </div>);
    }
}