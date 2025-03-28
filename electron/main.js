const { app, BrowserWindow, screen, Menu, ipcMain, net } = require('electron');
const path = require('path');

// 不同环境设置打包路径
const userDataPath = path.join(app.getPath('userData'), 'dev');
app.setPath('userData', userDataPath);

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

    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

    const platform = process.platform;

    const screenMap = () => {
      switch (platform) {
        case "darwin":
          return {
            height: sw && sw >= 2560 ? 1080 : 800,
            width: sw && sw >= 2560 ? 1980 : 1400,
          }
        default:
          return {
            height: sw && sw >= 2560 ? 1080 : 900,
            width: sw && sw >= 2560 ? 1980 : 1600,
          }
      }
    }


    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
      width: screenMap().width,
      height: screenMap().height,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"), // 预加载脚本
        contextIsolation: true, // 启用上下文隔离
        nodeIntegration: true, // 禁用 Node.js 集成（推荐false）
      },
    });

    mainWindow.setMenuBarVisibility(false);

    // 在 macOS 系统中全局去除菜单栏
    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(null);
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

const fs = require('fs');
const activeDownloads = new Map();
ipcMain.on('start-download', (event, { url, savePath }) => {
  const request = net.request(url);
  let receivedBytes = 0;
  let totalBytes = 0;

  request.on('response', (response) => {
    activeDownloads.set(url, request);
    totalBytes = parseInt(response.headers['content-length'], 10) || 0;

    response.on('data', (chunk) => {
      receivedBytes += chunk.length;
      // 发送进度更新到渲染进程
      event.sender.send('download-progress', {
        progress: totalBytes > 0 ? (receivedBytes / totalBytes * 100).toFixed(2) : 0,
        received: receivedBytes,
        total: totalBytes
      });
    });

    response.on('end', () => {
      event.sender.send('download-complete', { path: savePath });
    });

    response.on('error', (error) => {
      event.sender.send('download-error', error.message);
    });
  });

  // 创建可写流保存文件
  const fileStream = fs.createWriteStream(savePath);
  request.pipe(fileStream);
  request.end();
});

ipcMain.on('cancel-download', (event, url) => {
  const request = activeDownloads.get(url);
  if (request) {
    request.abort();
    activeDownloads.delete(url);
  }
});