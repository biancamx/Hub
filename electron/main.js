const { app, BrowserWindow, Tray, ipcMain, screen, shell } = require("electron");
const fs = require("fs");
const path = require("path");

let mainWindow = null;
let quickWindow = null;
let tray = null;

// URL oficial na Vercel (ou localhost em desenvolvimento)
const BASE_URL = process.env.ELECTRON_START_URL || "https://hub-biancamx.vercel.app";

// 🛡️ REGRA DE OURO: Força qualquer link externo a abrir no Chrome/Edge nativo do Windows
function setupExternalLinks(win) {
  // Intercepta cliques com target="_blank"
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const isInternal =
        url.includes("hub-biancamx.vercel.app") || url.includes("localhost:3000");

      if (!isInternal) {
        shell.openExternal(url); // Abre no navegador padrão do Windows!
        return { action: "deny" }; // Não abre janela no Electron
      }
    }
    return { action: "allow" };
  });

  // Intercepta navegações diretas dentro da janela
  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const isInternal =
        url.includes("hub-biancamx.vercel.app") || url.includes("localhost:3000");

      if (!isInternal) {
        event.preventDefault();
        shell.openExternal(url); // Abre no Chrome/Edge padrão!
      }
    }
  });
}

// 1. Janela Principal (Hub Completo)
function createMainWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: "Hub Produção",
    autoHideMenuBar: true,
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setupExternalLinks(mainWindow);
  mainWindow.loadURL(BASE_URL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 2. Janelinha Rápida (Tray Popover)
function createQuickWindow() {
  quickWindow = new BrowserWindow({
    width: 380,
    height: 520,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setupExternalLinks(quickWindow);
  quickWindow.loadURL(`${BASE_URL}/quick`);

  quickWindow.on("blur", () => {
    quickWindow.hide();
  });
}

function toggleQuickWindow() {
  if (!quickWindow) createQuickWindow();

  if (quickWindow.isVisible()) {
    quickWindow.hide();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const windowBounds = quickWindow.getBounds();

  // Posiciona perfeitamente colado ao relógio do Windows
  const x = Math.round(width - windowBounds.width - 16);
  const y = Math.round(height - windowBounds.height - 16);

  quickWindow.setPosition(x, y, false);
  quickWindow.show();
  quickWindow.focus();
}

function getTrayIconPath() {
  const localIcon = path.join(__dirname, "icon.png");
  const publicIcon = path.join(__dirname, "..", "public", "icon.png");
  const publicLogo = path.join(__dirname, "..", "public", "logo.png");

  if (fs.existsSync(localIcon)) return localIcon;
  if (fs.existsSync(publicIcon)) return publicIcon;
  if (fs.existsSync(publicLogo)) return publicLogo;
  return null;
}

function createTray() {
  const iconPath = getTrayIconPath();

  // Se não encontrar nenhum ícone, não quebra o app
  if (!iconPath) {
    console.warn("Nenhum arquivo de ícone encontrado para a bandeja (Tray).");
    return;
  }

  try {
    tray = new Tray(iconPath);
    tray.setToolTip("Hub Produção - Acesso Rápido");

    tray.on("click", () => {
      toggleQuickWindow();
    });
  } catch (err) {
    console.warn("Não foi possível carregar o ícone na bandeja:", err.message);
  }
}

// 🚀 QUANDO CLICA EM "HUB COMPLETO" NA TELINHA RÁPIDA:
ipcMain.on("open-main-window", () => {
  if (quickWindow) {
    quickWindow.hide();
  }
  createMainWindow();
});

app.whenReady().then(() => {
  createTray();
  createQuickWindow();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
