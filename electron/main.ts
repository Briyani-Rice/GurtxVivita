import { app, BrowserWindow, ipcMain, nativeTheme, Tray, Menu,globalShortcut } from "electron"
import path from "path"
import { fileURLToPath } from "url"
import fs from "node:fs";
import Store from 'electron-store';
import Ajv from "ajv";
import {FloorData, User} from "../src/types";

const ajv = new Ajv();

const schema = {
    type: "object",
    properties: {
        settings: {
            type: "object",
            properties: {
                Appearance: {
                    type: "object",
                    properties: {
                        Theme: {
                            type: "string",
                            enum: ["light", "dark", "system"]
                        }
                    },
                    required: ["Theme"],
                    additionalProperties: false
                }
            },
            required: ["Appearance"],
            additionalProperties: false
        },

        user: {
            type: "object"
        },

        app: {
            type: "object"
        }
    },

    required: ["settings"],
    additionalProperties: false
};

const validate = ajv.compile(schema);

const store = new Store();

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow:BrowserWindow
let tray: Tray | null = null

let floorData:FloorData[] = [
    {
        elements: [

        ],
        id: crypto.randomUUID(),
        name: "1 F"
    },{
        elements: [

        ],
        id: crypto.randomUUID(),
        name: "2 F"
    },
]


let user: User | null=null


const template: Electron.MenuItemConstructorOptions[] = [
    {
        label: app.name,
        submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "quit" } // Cmd+Q
        ]
    },
    {
        label: "Edit",
        submenu: [
            { role: "undo" },       // Cmd+Z
            { role: "redo" },       // Shift+Cmd+Z
            { type: "separator" },
            { role: "cut" },        // Cmd+X
            { role: "copy" },       // Cmd+C
            { role: "paste" },      // Cmd+V
            { role: "delete" },     // Delete
            { role: "selectAll" }   // Cmd+A
        ]
    },
    {
        label: "Window",
        submenu: [
            { role: "minimize" },   // Cmd+M
            { role: "zoom" },   // Cmd+Ctrl+F
        ]
    }
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template))

function createWindow() {
    console.log("Yesbro:"+fs.existsSync(path.join(__dirname, "../public/GurtXVivita_Logo_1024x1024.png")))
    console.log("ICON EXISTS:", fs.existsSync(
        path.join(__dirname, "../public/GurtXVivita_Logo_1024x1024.png")
    ))
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: "GurtxVivita",
        webPreferences: {
            preload: path.join(__dirname, "../dist-electron/preload.js"),
            nodeIntegration: true,
            contextIsolation: true
        },
        ...(process.platform === "darwin"
            ? { titleBarStyle: "hiddenInset" }
            : { titleBarStyle: "hidden" }),
        ...(process.platform !== "darwin" ? { titleBarOverlay: true } : {}),
        icon: app.isPackaged
            ? path.join(process.resourcesPath, "assets/GurtXVivita_Logo_1024x1024.png")
            : path.join(__dirname, "../public/GurtXVivita_Logo_1024x1024.png")
    })

    if (!app.isPackaged) {
        mainWindow.loadURL("http://localhost:5173")
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
    }

    mainWindow.webContents.setZoomFactor(1.0); // Reset to 100%
    mainWindow.webContents.setVisualZoomLevelLimits(1, 1); // Disable pinch/trackpad zoom
}

app.whenReady().then(() => {
    createWindow()

    tray = new Tray(
        path.join(__dirname, "../nativeIcons/GurtXVivita_Logo.png")
    )

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Open",
            click: () => {
                mainWindow?.show()
                mainWindow?.focus()
            }
        },
        {
            label: "Hide",
            click: () => {
                mainWindow?.hide()
            }
        },
        {
            label: "Quit",
            click: () => {
                app.quit()
            }
        }
    ])

    tray.setToolTip("GurtxVivita")
    tray.setContextMenu(contextMenu)

    tray.on("click", () => {
        if (!mainWindow) return

        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
            mainWindow.focus()
        }
    })
    mainWindow.webContents.setZoomFactor(1);
    let e = async ()=>{
        await mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
    }
    e()
    mainWindow.webContents.on("before-input-event", (event, input) => {
        if (
            input.meta && // Cmd on macOS
            (input.key === "+" ||
                input.key === "-" ||
                input.key === "0" ||
                input.key === "=")
        ) {
            event.preventDefault();
        }
    });
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})

process.on("SIGINT", () => process.exit(0))

ipcMain.handle("get-md-files", async () => {
    try {
        const devPath = path.join(__dirname, "../src/components/Docs/Resources/MDFiles");
        const prodPath = path.join(__dirname, "../components/Docs/Resources/MDFiles");
        const fullPath = app.isPackaged ? prodPath : devPath;

        const files = await fs.promises.readdir(fullPath);
        return files.map(f => path.join(fullPath, f)); // return strings only
    } catch (err) {
        return [];
    }
});
ipcMain.handle("load-file-content", async (event, filePath: string):Promise<String> => {
    console.log("Opening file")
    try {
        const data = await fs.promises.readFile(filePath, "utf8");
        console.log(data)
        return data;
    } catch (err) {
        console.error(err);
        return `# ERROR: ${err}`;
    }
});
ipcMain.handle(
    "save-settings",
    async (event, data: string): Promise<boolean> => {
        try {
            const value = JSON.parse(data);

            const isValid = validate(value);

            if (!isValid) {
                console.error(validate.errors);
                return false;
            }

            // Save only AFTER validation
            Object.entries(value).forEach(([key, val]) => {
                store.set(key, val);
            });

            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
);
ipcMain.handle(
    "get-settings",
    async (event): Promise<string> => {
        return store.get("settings")
    }
);
ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
        nativeTheme.themeSource = 'light'
    } else {
        nativeTheme.themeSource = 'dark'
    }
    return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system'
})

ipcMain.handle('sign-in:user',(event,creds)=>{
    const { username, password} = creds;
    console.log(username)
    const find = User.DEMO_ACCS.find((value, index, obj)=> {
        console.log(value.getUsername())
        return value.getUsername() == username
    });
    if (find==undefined) {
        return {success: false, note: "Invalid username"}
    }else{
        if (find.isPassword(password)){
            user = find
            return {success:true, note: "Welcome back!"}
        }else{
            return {success:false, note: "Password incorrect"}
        }
    }
})
