const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development'; // Check if running in dev mode

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        icon: path.join(__dirname, isDev ? 'icon.png' : '../icon.png'), // Handle path differences between dev/prod
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            devTools: isDev, // Enable DevTools only in dev mode
        },
        autoHideMenuBar: true, // Hide the default file menu (File, Edit, etc.)
        backgroundColor: '#020617', // Match NOVAIS dark theme background
        title: 'NOVAIS',
    });

    // Load the app
    // In dev: load localhost:3000
    // In prod: load the build/index.html file
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, 'index.html')}`;

    mainWindow.loadURL(startUrl);

    // Open external links in default browser, not inside the app
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://') || url.startsWith('http://')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Open the DevTools if in dev mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Google Login IPC
    ipcMain.on('google-login', (event, url) => {
        const authWindow = new BrowserWindow({
            width: 500,
            height: 600,
            show: true,
            parent: mainWindow,
            modal: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        authWindow.loadURL(url);

        authWindow.webContents.on('will-redirect', (e, newUrl) => {
            handleCallback(newUrl);
        });

        authWindow.webContents.on('did-navigate', (e, newUrl) => {
            handleCallback(newUrl);
        });

        function handleCallback(newUrl) {
            if (newUrl.includes('token=')) {
                const rawUrl = newUrl;
                const token = rawUrl.split('token=')[1].split('&')[0];
                mainWindow.webContents.send('google-login-success', token);
                authWindow.close();
            }
        }
    });
}

// App lifecycle
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
