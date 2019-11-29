const { app, BrowserWindow, Menu } = require("electron");
const fs = require("fs");
const crypto = require('crypto');
const path = require("path");
const isDev = require("electron-is-dev");
// const Store = require("electron-store");
require('dotenv').config()

// const store = new Store({
//   name: "Settings",
//   encryptionKey:'677e8e805553df6aaac622e6d01107bd31f62829ff72faf67e2ea5818ae3c438'
// });

// if (fs.existsSync("/home/prajwalgowda/.config/cra-electron/Settings.json")) {
//   console.log("The file exists.");
// } else {
//   console.log('file doesnt exist')
// } 


let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: { nodeIntegration: true, webSecurity: false }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(
    isDev
    ? "http://localhost:3000/"
    : `file://${path.join(__dirname, "../build/index.html")}`
    );
    mainWindow.webContents.openDevTools();
    mainWindow.on("closed", () => (mainWindow = null));
  }
  
  app.on("ready",createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

