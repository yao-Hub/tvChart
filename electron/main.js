const { app, BrowserWindow, screen, Menu, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

const { getDeviceInfo } = require('./utils/systemInfo');
const Downloader = require('./utils/downloader');
const ShortcutManager = require('./utils/shortcutManager');
const WindowStateManager = require('./utils/windowStateManager');
const { sleep } = require('./utils/common');

// 所有通过createWindow创建的窗口
const windowsMap = {};

// 启动画面
let splashWindow = null;

// 创建快捷键管理器实例
const shortcutManager = new ShortcutManager();

// 下载控制器
let downloader;

// 窗口状态管理器
let windowStateManager = {};

// 翻译
let translationsMap = {};

// 尝试获取单实例锁
const gotTheLock = app.requestSingleInstanceLock();

// 主题文件缓存路径
const systemCachePath = path.join(app.getPath('userData'), `systemCache.json`);

// 创建启动画面
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 720,
    height: 480,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: false, // 禁用开发者工具
    }
  });

  // 居中显示启动画面
  splashWindow.center();

  // 加载启动画面 HTML 文件
  splashWindow.loadFile(path.join(__dirname, 'splash.html'), { query: { version: app.getVersion() } });

  return splashWindow;
}

// 创建窗口
function createWindow(name, hash, screenWidth, showOnReady = true) {

  // electron是否是本地环境（electron环境只有production和development，打包之后运行都是production，本地运行就是development）
  const ifDev = process.env.NODE_ENV === "development";

  // 初始化主题色
  let systemTheme = "dark";
  const bgOptions = {
    light: '#fff',
    dark: '#17181A'
  };
  if (fs.existsSync(systemCachePath)) {
    const systemData = fs.readFileSync(systemCachePath, 'utf8');
    systemTheme = JSON.parse(systemData).systemTheme || 'dark';
  }
  nativeTheme.themeSource = systemTheme;

  // 窗口16:9
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;
  const width = sw >= 2560 ? 1980 : 1400;
  const renderWidth = screenWidth || width;
  const renderHight = Math.floor(renderWidth / 16 * 9);

  windowStateManager[name] = new WindowStateManager(name);

  // 设置默认窗口大小
  windowStateManager[name].setDefaultSize(renderWidth, renderHight);

  // 获取窗口状态
  const windowState = windowStateManager[name].getState();

  // 创建浏览器窗口
  windowsMap[name] = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 1110,
    minHeight: 640,
    show: false,  // 先隐藏窗口
    backgroundColor: bgOptions[systemTheme], // ready-to-show之前显示的背景
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 预加载脚本
      contextIsolation: true, // 启用上下文隔离
      nodeIntegration: false, // 禁用 Node.js 集成（推荐false）
    },
  });

  // 监听窗口大小变化
  windowStateManager[name].registerScreenSizeHandlers(windowsMap[name]);

  // Windows Linux 设置菜单栏是否可见
  windowsMap[name].setMenuBarVisibility(false);

  // 设置窗口快捷键
  shortcutManager.setupWindowShortcuts(windowsMap[name]);

  // 在 macOS 系统中全局去除菜单栏
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(null);
  }

  // 窗口加载地址
  if (hash) {
    windowsMap[name].loadFile(path.join(__dirname, `../dist/index.html`), { hash });
  }
  // 主窗口加载地址
  if (ifDev && name === "mainWindow") {
    // 打开开发者工具
    windowsMap[name].webContents.openDevTools();

    // 开发环境：加载本地服务器地址（npm run dev/prd/staging）
    windowsMap[name].loadURL("http://localhost:8080");
  }
  if (!ifDev && name === "mainWindow") {
    // 生产环境：加载打包后的文件
    windowsMap[name].loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 显示窗口（避免从普通状态切到最大化时的闪烁）
  if (showOnReady) {
    windowsMap[name].once('ready-to-show', () => {
      windowsMap[name].show();
    });
  }

  // 窗口监听关闭
  windowsMap[name].on('close', async (event) => {
    // 主窗口关闭
    if (downloader && downloader.activeDownload && name === "mainWindow") {
      const { shutdown, cancel, exitTip, downLoading } = translationsMap;
      const choice = dialog.showMessageBoxSync(windowsMap.mainWindow, {
        type: 'question',
        buttons: [shutdown, cancel],
        title: downLoading,
        message: exitTip,
        defaultId: 1, // 默认选中"取消"
        cancelId: 1, // 关闭默认选中"取消"
      });
      if (choice === 0) {
        await downloader.safeSaveDownload();
        windowsMap.mainWindow.close();
      } else {
        event.preventDefault();
      }
    } else {
      delete windowsMap[name];
    }
  });

  return windowsMap[name];
}

/**** 启动应用 ****/
if (!gotTheLock) {
  // 如果没有获取到锁，说明已经有一个实例在运行，直接退出当前实例
  app.quit();
} else {
  // 如果获取到锁，说明这是第一个实例
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当第二个实例启动时，聚焦到主窗口
    if (windowsMap.mainWindow) {
      if (windowsMap.mainWindow.isMinimized()) windowsMap.mainWindow.restore();
      windowsMap.mainWindow.focus();
    }
  });

  app.on('ready', () => {
    // 创建启动画面
    createSplashWindow();
  });

  // 当 Electron 完成初始化 创建主窗口 下载器
  app.whenReady().then(() => {
    const wind = createWindow("mainWindow", null, null, false);

    downloader = new Downloader(app, wind);

    // 监听主窗口加载完成事件
    wind.webContents.on('ready-to-show', async () => {
      await sleep(1000);

      // 关闭启动画面
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }

      const screenState = windowStateManager.mainWindow.getState();

      // 是否最大化
      if (screenState && screenState.isMaximized) {
        wind.maximize();
      }

      if (screenState && (screenState.x < 0 || screenState.y < 0)) {
        wind.center();
      }

      // 显示主窗口
      wind.show();
    });
  });

  // 只有macOS会触发事件 当应用被激活时发出
  app.on('activate', () => {
    // 在 macOS 上，当点击 Dock 图标并且没有其他窗口打开时，重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow("mainWindow", null, null, false);
  });

  // 在非 macOS 系统上，退出应用
  app.on('window-all-closed', (event) => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

// 创建新窗口
ipcMain.handle('open-new-window', (event, params) => {
  const { name, hash } = params;
  // 已经存在窗口不在创建
  if (windowsMap[name]) {
    windowsMap[name].focus();
    return;
  }
  createWindow(name, hash, 800);
});

// 获取系统信息
ipcMain.handle('get-system-info', async () => {
  const info = await getDeviceInfo();
  return info;
});

// 改变系统主题
ipcMain.handle('dark-mode:toggle', (event, theme) => {
  nativeTheme.themeSource = theme;
  const saveState = JSON.stringify({ systemTheme: theme });
  fs.writeFileSync(systemCachePath, saveState, 'utf8');
});

// 翻译
ipcMain.on('set-translations', (event, translations) => {
  translationsMap = translations;
});