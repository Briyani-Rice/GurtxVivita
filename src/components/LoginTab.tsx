import {Tab} from "../types";
import React, {useState} from "react";
import {welcomeTab} from "../app";
import {Eye, EyeClosed} from "lucide-react";

class LoginTab implements Tab{
    content: React.ReactNode;
    id: string = crypto.randomUUID();
    name: string = "Login";

    constructor() {
        this.content = (<LoginTabContent/>)
    }

}
function LoginTabContent(){
    const [showPass, setShowPass] = useState<boolean>(false)
    return (<div style={{
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
    }}>
        <div style={{
            alignContent:"center",
            alignItems:"center",
        }}>
            <h1>Login to Viventory</h1>

            <label htmlFor="username">Username: </label>
            <input type="text" id="username" name="email"style={{
                outline:"none",
                border:"none",
                borderBottom:"1px solid black",
                background:"transparent",
                fontFamily:"monospace"
            }}/><br/>

            <label htmlFor="password">Password: </label>
            <input style={{
                outline:"none",
                border:"none",
                borderBottom:"1px solid black",
                background:"transparent",
                fontFamily:"monospace"
            }} type={
                showPass ? "text" : "password"
            } id="password" name="password" />
            <button style={{
                outline:"none",
                border:"none",
                width:"25px",
                height:"25px",
                padding:"1px"
            }} onClick={()=>{
                setShowPass(!showPass)
            }}>{showPass? <Eye/> : <EyeClosed/>}</button>
            <br/>

            <button
                onClick={ async () => {
                    const username:string = document.getElementById("username")?.value;
                    const password:string = document.getElementById("password")?.value;

                    let res = await window.user?.signIn({username, password});
                    if (!res["success"]) {
                        const noteElement = document.getElementById("note");
                        if (noteElement) {
                            noteElement.innerHTML = res["note"];
                        }
                    }
                }}
            >
                Login!
            </button>
            <p id="note"></p>
        </div>
    </div>)
}
export default LoginTab;