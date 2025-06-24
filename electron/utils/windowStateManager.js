const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');

class WindowStateManager {
  constructor(windowName) {
    this.userDataPath = app.getPath('userData');
    this.windowName = windowName;
    this.stateFilePath = path.join(this.userDataPath, `${windowName}-window-state.json`);
    this.defaultSize = null;
  }

  setDefaultSize(width, height) {
    this.defaultSize = { width, height };
  }

  getState() {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`读取窗口状态失败 (${this.windowName}):`, error);
    }

    // 返回默认尺寸
    return this.defaultSize
      ? { ...this.defaultSize, isMaximized: false }
      : { width: 1400, height: 788, isMaximized: false };
  }

  saveState(bounds, isMaximized = false) {
    try {
      const saveState = bounds || this.getState();
      const state = {
        width: saveState.width,
        height: saveState.height,
        x: saveState.x,
        y: saveState.y,
        isMaximized: isMaximized
      };
      fs.writeFileSync(this.stateFilePath, JSON.stringify(state));
    } catch (error) {
      console.error(`保存窗口状态失败 (${this.windowName}):`, error);
    }
  }

  registerScreenSizeHandlers(bom) {
    // 监听窗口大小变化
    bom.on('resize', () => {
      if (!bom.isMaximized() && !bom.isMinimized()) {
        const bounds = bom.getBounds();
        this.saveState(bounds, false);
      }
    });
    // 监听窗口移动
    bom.on('move', () => {
      if (!bom.isMaximized() && !bom.isMinimized()) {
        const bounds = bom.getBounds();
        this.saveState(bounds, false);
      }
    });
    // 监听最大化状态变化
    bom.on('maximize', () => {
      this.saveState(null, true);
    });

    // 监听取消最大化状态
    bom.on('unmaximize', () => {
      this.saveState(null, false);
    });
  }
}

module.exports = WindowStateManager;