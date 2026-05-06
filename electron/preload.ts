const { contextBridge, ipcRenderer } = require('electron');

// @ts-ignore
contextBridge.exposeInMainWorld('electron', {
    send: (channel: any, data: any) => ipcRenderer.send(channel, data),
    on: (channel: any, func: (arg0: any) => any) =>
        ipcRenderer.on(channel, (event: any, ...args: any) => func(...args)),

    platform: process.platform,
    isMac: process.platform === 'darwin'
});