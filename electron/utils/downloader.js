const fs = require("fs");
const path = require("path");
const { net, ipcMain } = require("electron");

class Downloader {
  constructor(app, mainWindow) {
    this.app = app;
    this.mainWindow = mainWindow;

    // 下载进度
    this.activeDownload = null;
    // 是否已经下载完毕的回调
    this.writeCompletionCallback = null;

    // 保存下载 缓存和文件地址
    this.saveFileRouteName = "userData";
    this.saveCacheRouteName = "userData";

    this.registerIpcHandlers();
  }

  async runInstaller(exePath) {
    if (!fs.existsSync(exePath)) {
      throw new Error("安装文件不存在");
    }

    const { exec } = require("child_process");

    const commandObj = {
      win32: `${exePath} /SILENT`,
      darwin: `open ${exePath}`,
      linux: `xdg-open ${exePath}`
    };

    const command = commandObj[process.platform];

    exec(command);
  }

  // 主窗口关闭应用前确保完整保存文件数据和进度
  async safeSaveDownload() {
    if (this.activeDownload) {
      const { request } = this.activeDownload;
      request.abort();

      this.mainWindow.webContents.send("download-stop");

      // 等待当前写入操作完成
      await new Promise((resolve) => {
        this.writeCompletionCallback = resolve;
      });
      this.activeDownload = null;
    }
  }

  // 缓存下载进度
  saveDownloadState(params = {}) {
    const state = { ...this.activeDownload, ...params };
    const statePath = path.join(
      this.app.getPath(this.saveCacheRouteName),
      "downloadState.json"
    );
    fs.writeFileSync(statePath, JSON.stringify(state));
  }

  // 读取缓存进度
  loadDownloadState() {
    const statePath = path.join(
      this.app.getPath(this.saveCacheRouteName),
      "downloadState.json"
    );
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, "utf-8"));
    }
    return null;
  }

  // 清除缓存进度
  clearDownloadState() {
    const statePath = path.join(
      this.app.getPath(this.saveCacheRouteName),
      "downloadState.json"
    );
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
      const { tmpPath } = state;

      // 删除临时文件
      if (tmpPath && fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
      fs.unlinkSync(statePath);
    }
  }

  // 开始更新
  startDownload(event, downloadUrl) {
    let tmpPath;
    let receivedBytes = 0;
    let totalBytes = 0;
    let nowProgress = 0;

    // 下载地址
    const filename = path.basename(new URL(downloadUrl).pathname);
    // 下载保存位置
    const savePath = path.join(
      this.app.getPath(this.saveFileRouteName),
      filename
    );

    // 检查是否存在未完成的下载
    const existingState = this.loadDownloadState();

    if (
      existingState &&
      existingState.downloadUrl === downloadUrl &&
      existingState.safeSave
    ) {
      // 恢复下载
      tmpPath = existingState.tmpPath;
      receivedBytes = existingState.receivedBytes;
    } else {
      tmpPath = `${savePath}.part`;
    }
    const request = net.request(downloadUrl);

    // 创建可写流（追加模式支持断点续传）
    const fileStream = fs.createWriteStream(tmpPath, { flags: "a" });

    request.on("response", (response) => {
      // 获取文件总大小
      totalBytes = parseInt(response.headers["content-length"]) || 0;

      // 处理断点续传
      if (receivedBytes > 0) totalBytes += receivedBytes;
      const rangeHeader = response.headers["content-range"];
      if (rangeHeader) {
        const match = rangeHeader.match(/bytes (\d+)-(\d+)\/(\d+)/);
        if (match) receivedBytes = parseInt(match[1], 10);
      }

      response.on("data", (chunk) => {
        receivedBytes += chunk.length;

        this.activeDownload = {
          request,
          tmpPath,
          downloadUrl,
          receivedBytes,
          totalBytes,
          completed: false,
        };

        // 实时保存进度
        this.saveDownloadState();
        fileStream.write(chunk, () => {
          if (this.writeCompletionCallback) {
            this.writeCompletionCallback(); // 通知写入完成
            this.writeCompletionCallback = null;
          }
        });

        // 当前进度 并发送到主窗口
        nowProgress = (receivedBytes / totalBytes).toFixed(2);
        this.mainWindow.setProgressBar(Math.min(+nowProgress, 1));

        // 实时发送进度
        event.sender.send("download-progress", {
          progress: Math.min(+nowProgress * 100, 99),
          received: receivedBytes,
          total: totalBytes,
        });
      });

      response.on("end", async () => {
        fileStream.end();
        this.activeDownload.completed = true;
        this.saveDownloadState();
        // 更改下载安装包名字
        fs.renameSync(tmpPath, savePath);
        event.sender.send("download-completed");
        this.activeDownload = null;
        // 安装
        this.runInstaller(savePath);
      });
    });

    request.on("error", (error) => {
      fs.unlink(tmpPath, () => { });
      event.sender.send("download-error", error);
      this.mainWindow.setProgressBar(Math.min(+nowProgress, 1), { mode: "error" });
    });

    // 设置Range请求头（实现断点续传）
    if (fs.existsSync(tmpPath)) {
      const stats = fs.statSync(tmpPath);
      receivedBytes = stats.size;
      request.setHeader("Range", `bytes=${receivedBytes}-`);
    }

    request.end();
  }

  // 开始安装
  startInstall(downloadUrl) {
    const filename = path.basename(new URL(downloadUrl).pathname);
    const savePath = path.join(
      this.app.getPath(this.saveFileRouteName),
      filename
    );
    if (savePath) {
      this.runInstaller(savePath);
    }
  }

  // 检查更新状态
  checkDownloadStatus(url) {
    const state = this.loadDownloadState();
    if (state) {
      const filename = path.basename(new URL(url).pathname);
      const savePath = path.join(
        this.app.getPath(this.saveFileRouteName),
        filename
      );
      // 存在下载完成的文件
      if (fs.existsSync(savePath) && state.downloadUrl === url) {
        return state;
      }
      // 存在下载未完成的临时文件
      if (fs.existsSync(state.tmpPath) && state.downloadUrl === url) {
        return state;
      }
    }
    this.clearDownloadState();
    return null;
  }

  registerIpcHandlers() {
    ipcMain.handle("start-download", (event, downloadUrl) => {
      this.startDownload(event, downloadUrl);
    });

    ipcMain.handle("start-install", async (event, downloadUrl) => {
      this.startInstall(downloadUrl);
    });

    ipcMain.handle("check-download-status", (event, url) => {
      this.checkDownloadStatus(url);
    });

    ipcMain.handle("clear-download-cache", () => this.clearDownloadState());
  }
}

module.exports = Downloader;