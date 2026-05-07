import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: "GurtxVivita",
        webPreferences: {
            preload: path.join(__dirname, '../dist-electron/preload.js'),
            nodeIntegration: true,
            contextIsolation: true,    
            // devTools: false 
        },
        ...(process.platform === 'darwin'
            ? { titleBarStyle: 'hiddenInset' }
            : { titleBarStyle: 'hidden' }),

        // optional modern controls on Windows/Linux
        ...(process.platform !== 'darwin'
            ? { titleBarOverlay: true }
            : {})
    });

    if (!app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

process.on('SIGINT', () => {
    process.exit(0);
});