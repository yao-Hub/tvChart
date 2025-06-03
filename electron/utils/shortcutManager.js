const SECRET_CODE = "yaozeyu";

class ShortcutManager {
  constructor() {
    this.ctrlActivated = false;
    this.inputIndex = 0;
  }

  setupWindowShortcuts(win) {
    win.webContents.on("before-input-event", (event, input) => {
      // 仅处理 keydown 事件
      if (input.type !== "keyDown") return;

      // 阻止 F12
      if (input.key === "F12") {
        event.preventDefault();
      }
      // 阻止 Ctrl+Shift+I
      if (input.control && input.shift && input.key.toLowerCase() === "i") {
        event.preventDefault();
      }
      // 阻止 Command+Option+I
      if (input.meta && input.alt && input.key.toLowerCase() === "i") {
        event.preventDefault();
      }

      // 处理快捷键激活状态
      if (input.key === "Control" || input.key === "Meta") {
        this.ctrlActivated = true;
        this.inputIndex = 0;
        return;
      }

      // 监听秘密代码输入
      if (this.ctrlActivated && !input.control && !input.meta && !input.alt) {
        const char = input.key.toLowerCase();
        if (char === SECRET_CODE[this.inputIndex]) {
          this.inputIndex++;
          // 匹配完整代码时打开开发者工具
          if (this.inputIndex === SECRET_CODE.length) {
            win.webContents.openDevTools();
            this.reset();
          }
        } else {
          this.reset();
        }
      }
    });
  }

  reset() {
    this.ctrlActivated = false;
    this.inputIndex = 0;
  }
}

module.exports = ShortcutManager;
