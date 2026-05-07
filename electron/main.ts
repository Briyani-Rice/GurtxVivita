import { app, BrowserWindow, ipcMain } from "electron"
import path from "path"
import { fileURLToPath } from "url"
import { readdir } from "node:fs/promises"
import { File } from "../src/components/fileHelper"
import fs from "node:fs";

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
        ...(process.platform !== "darwin" ? { titleBarOverlay: true } : {})
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
        console.log(files)
        return files.map(f => path.join(fullPath, f)); // return strings only
    } catch (err) {
        console.error(err);
        return [];
    }
});
ipcMain.handle("load-file-content", async (event, filePath: string) => {
    try {
        const data = await fs.promises.readFile(filePath, "utf8");
        return { success: true, content: data };
    } catch (err) {
        console.error(err);
        return { success: false, error: `${err}` };
    }
});