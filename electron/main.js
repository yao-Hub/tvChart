const { app, BrowserWindow, screen, Menu, ipcMain, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { getDeviceInfo } = require('./utils/systemInfo');

// 所有通过createWindow创建的窗口
const windowsMap = {};

// 输入的快捷键密钥
const secretCodeQueue = [];
const SECRET_CODE = 'yaozeyu';

// 下载进度
let activeDownload = null;

// 是否已经下载完毕的回调
let writeCompletionCallback = null;

// 保存下载 缓存和文件地址
const saveFileRouteName = "userData";
const saveCacheRouteName = "userData";

// 翻译
let translationsCache = {};
ipcMain.on('set-translations', (event, translations) => {
  translationsCache = translations;
});

// 尝试获取单实例锁
const gotTheLock = app.requestSingleInstanceLock();

// 创建窗口
function createWindow(name, hash, screenWidth) {

  getDeviceInfo().then(deviceInfo => {
    windowsMap[name].webContents.send("deviceInfo", deviceInfo);
  });

  // electron是否是本地环境（electron环境只有production和development，打包之后运行都是production，本地运行就是development）
  const ifDev = process.env.NODE_ENV === "development";

  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;

  const platform = process.platform;

  const screenMap = () => {
    switch (platform) {
      case "darwin":
        return {
          width: sw && sw >= 2560 ? 1980 : 1400,
        };
      default:
        return {
          width: sw && sw >= 2560 ? 1980 : 1600,
        };
    }
  };

  const renderWidth = screenWidth || screenMap().width;

  // 创建浏览器窗口
  windowsMap[name] = new BrowserWindow({
    width: renderWidth,
    height: renderWidth / 16 * 9,
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
    windowsMap[name].loadURL("http://localhost:8080");
  }
  if (!ifDev && name === "mainWindow") {
    // 生产环境：加载打包后的文件
    windowsMap[name].loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 窗口监听关闭
  windowsMap[name].on('close', async (event) => {
    // 主窗口关闭
    if (activeDownload && name === "mainWindow") {
      const { dialog } = require('electron');
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
        await safeSaveDownload();
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

    // 监听字符输入（忽略修饰键）打开开发者工具
    if (!input.control && !input.meta && !input.alt) {
      const char = input.key.toLowerCase();
      secretCodeQueue.push(char);

      // 保持队列长度与密码一致
      if (secretCodeQueue.length > SECRET_CODE.length) {
        secretCodeQueue.shift();
      }
      // 检测匹配
      if (secretCodeQueue.join('') === SECRET_CODE) {
        windowsMap[name].webContents.openDevTools();
        secretCodeQueue.length = 0; // 清空队列
      }
    }
  });
}

// 主窗口关闭应用前确保完整保存文件数据和进度
async function safeSaveDownload() {
  if (activeDownload) {
    const { request } = activeDownload;
    request.abort();

    windowsMap.mainWindow.webContents.send("download-stop");

    // 等待当前写入操作完成
    await new Promise((resolve) => {
      writeCompletionCallback = resolve;
    });
    activeDownload = null;
  }
}

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
      exec(command, { windowsHide: true }, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }
}

// 缓存下载进度
const saveDownloadState = (params = {}) => {
  const state = { ...activeDownload, ...params };
  const statePath = path.join(app.getPath(saveCacheRouteName), 'downloadState.json');
  fs.writeFileSync(statePath, JSON.stringify(state));
};

// 读取缓存进度
function loadDownloadState() {
  const statePath = path.join(app.getPath(saveCacheRouteName), 'downloadState.json');
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  }
  return null;
}

// 清除缓存进度
function clearDownloadState() {
  const statePath = path.join(app.getPath(saveCacheRouteName), 'downloadState.json');
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

  // 下载地址
  const filename = path.basename(new URL(downloadUrl).pathname);
  // 下载保存位置
  const savePath = path.join(app.getPath(saveFileRouteName), filename);

  // 检查是否存在未完成的下载
  const existingState = loadDownloadState();

  if (existingState && existingState.downloadUrl === downloadUrl && existingState.safeSave) {
    // 恢复下载
    tmpPath = existingState.tmpPath;
    receivedBytes = existingState.receivedBytes;
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
    if (receivedBytes > 0) totalBytes += receivedBytes;
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
        totalBytes,
        completed: false
      };

      // 实时保存进度
      saveDownloadState();
      fileStream.write(chunk, () => {
        if (writeCompletionCallback) {
          writeCompletionCallback(); // 通知写入完成
          writeCompletionCallback = null;
        }
      });

      // 实时发送进度
      event.sender.send('download-progress', {
        progress: Math.min((receivedBytes / totalBytes * 100).toFixed(2), 99),
        received: receivedBytes,
        total: totalBytes
      });
    });

    response.on('end', async () => {
      fileStream.end();
      activeDownload.completed = true;
      saveDownloadState();
      // 更改下载安装包名字
      fs.renameSync(tmpPath, savePath);
      event.sender.send('download-completed');
      activeDownload = null;
      // 安装
      Installer.run(savePath);
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

// 开始安装
ipcMain.handle('start-install', async (event, downloadUrl) => {
  const filename = path.basename(new URL(downloadUrl).pathname);
  const savePath = path.join(app.getPath(saveFileRouteName), filename);
  if (savePath) {
    Installer.run(savePath);
  }
});

// 检查更新状态
ipcMain.handle('check-download-status', (event, url) => {
  const state = loadDownloadState();

  if (state) {
    const filename = path.basename(new URL(url).pathname);
    const savePath = path.join(app.getPath(saveFileRouteName), filename);
    // 存在下载完成的文件
    if (fs.existsSync(savePath) && state.downloadUrl === url) {
      return state;
    }
    // 存在下载未完成的临时文件
    if (fs.existsSync(state.tmpPath) && state.downloadUrl === url) {
      return state;
    }
  };
  clearDownloadState();
  return null;
});

// 清除下载缓存
ipcMain.handle('clear-download-cache', () => clearDownloadState());

// 创建新窗口
ipcMain.handle('open-new-window', (event, params) => {
  const { name, hash } = params;
  // 已经存在窗口不在创建
  if (windowsMap[name]) {
    return;
  }
  createWindow(name, hash, 800);
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

  // 当 Electron 完成初始化 创建主窗口
  app.whenReady().then(() => createWindow("mainWindow"));

  app.on('activate', function () {
    // 在 macOS 上，当点击 Dock 图标并且没有其他窗口打开时，重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow("mainWindow");
  });

  // 当所有窗口关闭时退出应用
  app.on('window-all-closed', (event) => {
    app.quit();
  });
}
