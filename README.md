# Utrader

vue3 + vite + electron

## 运行注意事项

- 需要使用electron时，只能使用npm

## 打包注意事项

- 当打包生成mac的dmg包时，不在本机安装应用时，需要运行dmg包完成安装后，打开term终端输入指令

```bash
sudo xattr -rd com.apple.quarantine /Applications/CTOTrader.app
```

- 由于mac的芯片不同，所支持的dmg包不同，通过 electron/config/macOS 配置生成不同的包
