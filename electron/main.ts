import { app, BrowserWindow, ipcMain, nativeTheme, Tray } from "electron"
import path from "path"
import { fileURLToPath } from "url"
import fs from "node:fs";
import Store from 'electron-store';
import Ajv from "ajv";

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

let mainWindow

function createWindow() {
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
        icon:"../public/GurtXVivita_Logo.png"
    })

    if (!app.isPackaged) {
        mainWindow.loadURL("http://localhost:5173")
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
    }
}

app.whenReady().then(() => {
    createWindow()
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
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
        store
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