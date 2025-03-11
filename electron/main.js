const { app, BrowserWindow, screen, Menu } = require('electron');
const path = require('path');

let mainWindow;

// 尝试获取单实例锁
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 如果没有获取到锁，说明已经有一个实例在运行，直接退出当前实例
  app.quit();
} else {
  // 如果获取到锁，说明这是第一个实例
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当第二个实例启动时，聚焦到主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // 创建主窗口
  function createWindow() {

    const { width: sw } = screen.getPrimaryDisplay().workAreaSize;

    const windowMap = {
      width: sw && sw >= 2560 ? 1980 : 1600,
      height: sw && sw >= 2560 ? 1080 : 900,
    };

    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
      width: windowMap.width,
      height: windowMap.height,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"), // 预加载脚本
        contextIsolation: true, // 启用上下文隔离
        nodeIntegration: false, // 禁用 Node.js 集成（推荐）
      },
    });

    // 在 macOS 系统中全局去除菜单栏
    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(null);
    }

    if (process.env.NODE_ENV === "production") {
      // 去除菜单栏 无法打开开发者工具
      mainWindow.setMenu(null);
    }

    if (process.env.NODE_ENV === "development") {
      mainWindow.loadURL("http://localhost:8080");
      mainWindow.webContents.openDevTools(); // 打开开发者工具
    } else {
      // 生产环境：加载打包后的文件
      mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
  }

  // 当 Electron 完成初始化并准备创建浏览器窗口时调用 createWindow 函数
  app.whenReady().then(createWindow);

  app.on('activate', function () {
    // 在 macOS 上，当点击 Dock 图标并且没有其他窗口打开时，重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // 当所有窗口关闭时退出应用（除了在 macOS 上）
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}
