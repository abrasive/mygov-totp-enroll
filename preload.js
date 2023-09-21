// This preload script is courtesy of a helpful StackOverflow contributor
// https://stackoverflow.com/questions/44391448/electron-require-is-not-defined/59888788#59888788

const {
    contextBridge,
    ipcRenderer
} = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            ipcRenderer.send(channel, data);
        },
        receive: (channel, func) => {
            ipcRenderer.on(channel, (...args) => func(...args));
        }
    }
);
