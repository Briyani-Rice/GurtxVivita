const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    getMdFiles: ():string[] => ipcRenderer.invoke("get-md-files"),
    loadFileContent: (path: string):Promise<String> => ipcRenderer.invoke("load-file-content", path),
    invoke: (channel: string, data?: any) => {
        return ipcRenderer.invoke(channel, data);
    },

    send: (channel: string, data: any) => {
        ipcRenderer.send(channel, data);
    },

    on: (channel: string, func: (...args: any[]) => any) => {
        const listener = (_event: any, ...args: any[]) => func(...args);
        ipcRenderer.on(channel, listener);
        return () => ipcRenderer.removeListener(channel, listener);
    },

    platform: process.platform,
    isMac: process.platform === "darwin"
});