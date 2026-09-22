const { app, BrowserWindow, Tray, ipcMain, screen, shell, session } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let quickWindow = null;
let tray = null;

// URL Oficial na Vercel
const BASE_URL = process.env.ELECTRON_START_URL || "https://hub-biancamx.vercel.app";

// 🎭 Disfarce de Chrome para o Google autorizar o login sem bloqueios
const CHROME_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

app.userAgentFallback = CHROME_USER_AGENT;

// 🔍 Função que decide o que roda dentro do app e o que abre no Chrome externo
function isInternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();

    // Permite qualquer link da Vercel ou local rodar dentro do app
    if (host.endsWith("vercel.app") || host === "localhost" || host === "127.0.0.1") {
      return true;
    }

    // Permite a autenticação do Google rodar dentro do app para você conseguir logar!
    if (
      host.includes("accounts.google.com") ||
      host.includes("google.com") ||
      host.includes("gstatic.com")
    ) {
      return true;
    }

    // Qualquer outro site externo (Trello, GitHub, ERPs, etc.) deve abrir no Chrome fora do app
    return false;
  } catch {
    return false;
  }
}

function setupExternalLinks(win) {
  win.webContents.setUserAgent(CHROME_USER_AGENT);

  // Intercepta links de abas novas
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalUrl(url)) {
      return { action: "allow" };
    }
    // Abre ferramentas externas no navegador padrão do Windows!
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Intercepta navegações diretas
  win.webContents.on("will-navigate", (event, url) => {
    if (!isInternalUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

// 1. Janela Principal (Hub Completo)
function createMainWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
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
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // 💾 FORÇA A GRAVAÇÃO PERMANENTE DO LOGIN NO DISCO RÍGIDO:
      partition: "persist:hub_desktop",
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
      // 💾 COMPARTILHA A MESMA SESSÃO SALVA:
      partition: "persist:hub_desktop",
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
  if (!iconPath) return;

  try {
    tray = new Tray(iconPath);
    tray.setToolTip("Hub Produção - Acesso Rápido");

    tray.on("click", () => {
      toggleQuickWindow();
    });
  } catch (err) {
    console.warn("Aviso ao carregar Tray:", err.message);
  }
}

// Garante que qualquer cookie de login seja gravado no disco na hora
function setupSessionPersistence() {
  const ses = session.fromPartition("persist:hub_desktop");
  ses.cookies.on("changed", () => {
    ses.cookies.flushStore().catch(() => {});
  });
}

// Comunicação: Botão "Hub Completo" expande a janela principal
ipcMain.on("open-main-window", () => {
  if (quickWindow) quickWindow.hide();
  createMainWindow();
});

app.whenReady().then(() => {
  setupSessionPersistence();
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

app.on("before-quit", async () => {
  try {
    const ses = session.fromPartition("persist:hub_desktop");
    await ses.cookies.flushStore();
  } catch {}
});
