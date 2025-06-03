const fs = require('fs');
const path = require('path');
const { app } = require('electron');

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
    return this.defaultSize || { width: 1400, height: 788 };
  }

  saveState(bounds) {
    try {
      const state = {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y
      };
      fs.writeFileSync(this.stateFilePath, JSON.stringify(state));
    } catch (error) {
      console.error(`保存窗口状态失败 (${this.windowName}):`, error);
    }
  }
}

module.exports = WindowStateManager;