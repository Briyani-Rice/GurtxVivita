// @ts-ignore
const { contextBridge, ipcRenderer } = require('electron');
// @ts-ignore
contextBridge.exposeInMainWorld('electron', {
    send: (channel: any, data: any): any => ipcRenderer.send(channel, data),
    on: (channel: any, func: any): any =>
        // Prefix 'event' with an underscore to tell TS it's intentionally unused
        ipcRenderer.on(channel, (_event: any, ...args: any[]): any => func(...args)),
});
console.log("Preloaded!")