const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('novaisElectron', {
    startGoogleLogin: (url) => {
        if (typeof url !== 'string') return;
        if (!url.startsWith('https://') && !url.startsWith('http://')) return;
        ipcRenderer.send('google-login', url);
    },
    onceGoogleLoginSuccess: (callback) => {
        if (typeof callback !== 'function') return;
        ipcRenderer.once('google-login-success', (_event, token) => callback(token));
    },
});
