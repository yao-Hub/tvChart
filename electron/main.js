const { app, BrowserWindow, screen, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

const { getDeviceInfo } = require('./utils/systemInfo');
const Downloader = require('./utils/downloader');

// 所有通过createWindow创建的窗口
const windowsMap = {};

// 输入的快捷键密钥
let ctrlActivated = false;  // 标记Ctrl/Command是否被按过
let inputIndex = 0;           // 当前输入的密码字符索引
const SECRET_CODE = 'yaozeyu';

let downloader;

// 翻译
let translationsCache = {};
ipcMain.on('set-translations', (event, translations) => {
  translationsCache = translations;
});

// 尝试获取单实例锁
const gotTheLock = app.requestSingleInstanceLock();

// 创建窗口
function createWindow(name, hash, screenWidth) {

  // electron是否是本地环境（electron环境只有production和development，打包之后运行都是production，本地运行就是development）
  const ifDev = process.env.NODE_ENV === "development";

  // 窗口16:9
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;
  const width = sw >= 2560 ? 1980 : 1400;
  const renderWidth = screenWidth || width;
  const renderHight = Math.floor(renderWidth / 16 * 9);

  // 创建浏览器窗口
  windowsMap[name] = new BrowserWindow({
    width: renderWidth,
    height: renderHight,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 预加载脚本
      contextIsolation: true, // 启用上下文隔离
      nodeIntegration: false, // 禁用 Node.js 集成（推荐false）
      sandbox: false,
    },
  });

  windowsMap[name].setMenuBarVisibility(false);

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

  // 所有窗口快捷键阻止
  windowsMap[name].webContents.on('before-input-event', (event, input) => {
    // 仅处理 keydown 事件（跳过 keypress）
    if (input.type !== 'keyDown') return;

    // 阻止 F12
    if (input.key === 'F12') {
      event.preventDefault();
    }
    // 阻止 Ctrl+Shift+I (Windows/Linux)
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      event.preventDefault();
    }
    // 阻止 Command+Option+I (macOS)
    if (input.meta && input.alt && input.key.toLowerCase() === 'i') {
      event.preventDefault();
    }

    if (input.key === 'Control' || input.key === 'Meta') {
      ctrlActivated = true; // 标记为已激活
      inputIndex = 0;
      return;
    }

    // 监听字符输入（忽略修饰键）打开开发者工具
    if (ctrlActivated && !input.control && !input.meta && !input.alt) {
      const char = input.key.toLowerCase();
      if (char === SECRET_CODE[inputIndex]) {
        inputIndex++;
        // 完全匹配时打开开发者工具
        if (inputIndex === SECRET_CODE.length) {
          windowsMap[name].webContents.openDevTools();
          ctrlActivated = false;
          inputIndex = 0;
        }
      } else {
        // 输入错误字符，立即重置状态
        ctrlActivated = false;
        inputIndex = 0;
      }
    }
  });
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
