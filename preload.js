const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        on: (...args) => ipcRenderer.on(...args),
        send: (...args) => ipcRenderer.send(...args),
        once: (...args) => ipcRenderer.once(...args),
        removeAllListeners: (...args) => ipcRenderer.removeAllListeners(...args),
        invoke: (...args) => ipcRenderer.invoke(...args)
    }
});