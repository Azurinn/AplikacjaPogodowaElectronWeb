const {app, BrowserWindow, ipcMain} = require('electron');
const axios = require('axios');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        }
    });

    win.loadFile('weather.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('get-geolocation', async () => {
    try {
        const apiKey = '';
        const response = await axios.post(`https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching geolocation:', error);
        throw error;
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});