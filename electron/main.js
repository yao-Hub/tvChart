const { app, BrowserWindow, screen, Menu, ipcMain, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { debounce } = require('lodash');

let mainWindow;

let activeDownload = null;

// 翻译
let translationsCache = {};
ipcMain.on('set-translations', (event, translations) => {
  translationsCache = translations;
});

// 尝试获取单实例锁
const gotTheLock = app.requestSingleInstanceLock();

// ========== 安装器执行模块 ==========
class Installer {
  static async run(exePath, options = {}) {
    // 参数验证
    if (!fs.existsSync(exePath)) {
      throw new Error('安装文件不存在');
    }

    // 跨平台处理
    const command = process.platform === 'win32'
      ? `${exePath} /SILENT` // NSIS默认静默参数
      : process.platform === 'darwin'
        ? `open ${exePath}`
        : `xdg-open ${exePath}`;

    return new Promise((resolve, reject) => {
      const child = exec(command, { windowsHide: true }, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }
}

// 创建主窗口
function createWindow() {

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  const platform = process.platform;

  const screenMap = () => {
    switch (platform) {
      case "darwin":
        return {
          height: sw && sw >= 2560 ? 1080 : 850,
          width: sw && sw >= 2560 ? 1980 : 1400,
        };
      default:
        return {
          height: sw && sw >= 2560 ? 1080 : 900,
          width: sw && sw >= 2560 ? 1980 : 1600,
        };
    }
  };

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: screenMap().width,
    height: screenMap().height,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 预加载脚本
      contextIsolation: true, // 启用上下文隔离
      nodeIntegration: false, // 禁用 Node.js 集成（推荐false）
      sandbox: false,
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

  mainWindow.on('close', (event) => {
    if (activeDownload) {
      const { dialog } = require('electron');
      const { shutdown,
        cancel,
        exitTip,
        downLoading } = translationsCache;
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: [shutdown, cancel],
        title: downLoading,
        message: exitTip,
        defaultId: 1 // 默认选中"取消"
      });
      if (choice === 0) {
        saveProcess();
      } else {
        event.preventDefault();
      }
    }
  });
}

// 缓存下载进度
const saveDownloadState = debounce((params = {}) => {
  const state = { ...activeDownload, ...params };
  const statePath = path.join(app.getPath('userData'), 'downloadState.json');
  fs.writeFileSync(statePath, JSON.stringify(state));
}, 200);

// 读取缓存进度
function loadDownloadState() {
  const statePath = path.join(app.getPath('userData'), 'downloadState.json');
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  }
  return null;
}

// 清除缓存进度
function clearDownloadState() {
  const statePath = path.join(app.getPath('userData'), 'downloadState.json');
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    const { tmpPath } = state;

    // 删除临时文件
    if (tmpPath && fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
    fs.unlinkSync(statePath);
  }
}

// 开始更新
ipcMain.handle('start-download', (event, downloadUrl) => {

  let tmpPath;
  let receivedBytes = 0;
  let totalBytes = 0;

  const filename = path.basename(new URL(downloadUrl).pathname);
  const savePath = path.join(app.getPath('downloads'), filename);

  // 检查是否存在未完成的下载
  const existingState = loadDownloadState();

  if (existingState && existingState.downloadUrl === downloadUrl && existingState.safeSave) {
    // 恢复下载
    tmpPath = existingState.tmpPath;
  } else {
    tmpPath = `${savePath}.part`;
  }
  const request = net.request(downloadUrl);

  // 创建可写流（追加模式支持断点续传）
  const fileStream = fs.createWriteStream(tmpPath, { flags: 'a' });

  request.on('response', (response) => {
    // 获取文件总大小
    totalBytes = parseInt(response.headers['content-length']) || 0;

    // 处理断点续传
    const rangeHeader = response.headers['content-range'];
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes (\d+)-(\d+)\/(\d+)/);
      if (match) receivedBytes = parseInt(match[1], 10);
    }

    response.on('data', (chunk) => {
      receivedBytes += chunk.length;

      activeDownload = {
        request,
        tmpPath,
        downloadUrl,
        receivedBytes,
        totalBytes
      };

      // 实时保存进度
      saveDownloadState();
      fileStream.write(chunk);

      // 实时发送进度
      event.sender.send('download-progress', {
        progress: totalBytes > 0 ? (receivedBytes / totalBytes * 100).toFixed(2) : 0,
        received: receivedBytes,
        total: totalBytes
      });
    });

    response.on('end', () => {
      fileStream.end();
      activeDownload = null;
      fs.renameSync(tmpPath, savePath);
      event.sender.send('download-completed');
      // 安装
      Installer.run(savePath);
      setTimeout(() => {
        app.quit();
      }, 500);
    });
  });

  request.on('error', (error) => {
    fs.unlink(tmpPath, () => { });
    event.sender.send('download-error', error);
  });

  // 设置Range请求头（实现断点续传）
  if (fs.existsSync(tmpPath)) {
    const stats = fs.statSync(tmpPath);
    receivedBytes = stats.size;
    request.setHeader('Range', `bytes=${receivedBytes}-`);
  }

  request.end();
});

// 刷新or重新进入应用检查是否有未完成的更新
ipcMain.handle('check-download-status', () => {
  const state = loadDownloadState();
  // 验证临时文件是否存在
  if (state && fs.existsSync(state.tmpPath)) return state;
  else {
    clearDownloadState();
    return null;
  }
});

ipcMain.on('clear-download-state', () => {
  clearDownloadState();
});

function saveProcess() {
  if (activeDownload) {
    const { request } = activeDownload;

    request.abort();

    // 保存当前进度
    saveDownloadState({ safeSave: true });

    activeDownload = null;
  }
}

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

  // 当 Electron 完成初始化并准备创建浏览器窗口时调用 createWindow 函数
  app.whenReady().then(createWindow);

  app.on('activate', function () {
    // 在 macOS 上，当点击 Dock 图标并且没有其他窗口打开时，重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // 当所有窗口关闭时退出应用
  app.on('window-all-closed', (event) => {
    app.quit();
  });
}
