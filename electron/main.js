const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

function createWindow() {

  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;

  const windowMap = {
    width: sw && sw >= 2560 ? 1980 : 1600,
    height: sw && sw >= 2560 ? 1080 : 900,
  };

  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: windowMap.width,
    height: windowMap.height,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 预加载脚本
      contextIsolation: true, // 启用上下文隔离
      nodeIntegration: false, // 禁用 Node.js 集成（推荐）
    },
  });

  // 去除菜单栏
  // mainWindow.setMenu(null);

  // 在 macOS 系统中全局去除菜单栏
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(null);
  }

  // 加载 Vue 应用的 URL
  if (process.env.NODE_ENV === "development") {
    // 开发环境：加载 Vue DevServer 的 URL
    mainWindow.loadURL("http://localhost:8080");
    mainWindow.webContents.openDevTools(); // 打开开发者工具
  } else {
    // 生产环境：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// 应用准备就绪后创建窗口
app.whenReady().then(createWindow);

// 关闭所有窗口时退出应用（macOS 除外）
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 在 macOS 上点击 Dock 图标时重新创建窗口
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
