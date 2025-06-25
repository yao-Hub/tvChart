const { app, BrowserWindow, screen, Menu, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

const { getDeviceInfo } = require('./utils/systemInfo');
const Downloader = require('./utils/downloader');
const ShortcutManager = require('./utils/shortcutManager');
const WindowStateManager = require('./utils/windowStateManager');

// 所有通过createWindow创建的窗口
const windowsMap = {};

// 创建快捷键管理器实例
const shortcutManager = new ShortcutManager();

// 下载控制器
let downloader;

// 翻译
let translationsCache = {};
ipcMain.on('set-translations', (event, translations) => {
  translationsCache = translations;
});

// 尝试获取单实例锁
const gotTheLock = app.requestSingleInstanceLock();

// 主题文件缓存路径
const systemCachePath = path.join(app.getPath('userData'), `systemCache.json`);

// 创建窗口
function createWindow(name, hash, screenWidth) {

  // electron是否是本地环境（electron环境只有production和development，打包之后运行都是production，本地运行就是development）
  const ifDev = process.env.NODE_ENV === "development";

  // 窗口16:9
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;
  const width = sw >= 2560 ? 1980 : 1400;
  const renderWidth = screenWidth || width;
  const renderHight = Math.floor(renderWidth / 16 * 9);

  // 创建窗口状态管理器
  const windowStateManager = new WindowStateManager(name);
  windowStateManager.setDefaultSize(renderWidth, renderHight);
  const windowState = windowStateManager.getState();

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

  // 恢复最大化状态（如果有）
  if (windowState && windowState.isMaximized) {
    windowsMap[name].maximize();
  }

  // 显示窗口（避免从普通状态切到最大化时的闪烁）
  windowsMap[name].once('ready-to-show', () => {
    windowsMap[name].show();
  });

  // 监听窗口大小变化
  windowStateManager.registerScreenSizeHandlers(windowsMap[name]);

  windowsMap[name].setMenuBarVisibility(false); // Windows Linux 设置菜单栏是否可见

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
    windowsMap[name].webContents.openDevTools();
    windowsMap[name].loadURL("http://localhost:8080");
  }
  if (!ifDev && name === "mainWindow") {
    // 生产环境：加载打包后的文件
    windowsMap[name].loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 窗口监听关闭
  windowsMap[name].on('close', async (event) => {
    // 主窗口关闭
    if (downloader && downloader.activeDownload && name === "mainWindow") {
      const { shutdown,
        cancel,
        exitTip,
        downLoading } = translationsCache;
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

  // 设置窗口快捷键
  shortcutManager.setupWindowShortcuts(windowsMap[name]);
}


// 创建新窗口
ipcMain.handle('open-new-window', (event, params) => {
  const { name, hash } = params;
  // 已经存在窗口不在创建
  if (windowsMap[name]) {
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

  // 当 Electron 完成初始化 创建主窗口 下载器
  app.whenReady().then(() => {
    createWindow("mainWindow");
    downloader = new Downloader(app, windowsMap.mainWindow);
  });

  app.on('activate', function () {
    // 在 macOS 上，当点击 Dock 图标并且没有其他窗口打开时，重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow("mainWindow");
  });

  // 当所有窗口关闭时退出应用
  app.on('window-all-closed', (event) => {
    app.quit();
  });
}
