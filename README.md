# Utrader
vue3 + vite + electron

## 运行注意事项：
- 需要使用electron时，只能使用npm

## 打包注意事项
- 当打包生成mac的dmg包时，不在本机安装应用时，需要运行dmg包完成安装后，打开term终端输入指令

```bash
sudo xattr -rd com.apple.quarantine /Applications/UTrader.app
```
- 由于mac的芯片不同，所支持的dmg包不同，通过 electron/config/macOS 配置生成不同的包

- 打包不同环境的包，需要在 electron/main.js 中设置不同环境设置打包路径

```js
// dev
const userDataPath = path.join(app.getPath('userData'), 'dev');
app.setPath('userData', userDataPath);

// prod
const userDataPath = path.join(app.getPath('userData'), 'prod');
app.setPath('userData', userDataPath);
```

- 为了更好的管理打包目录，可以在 electron/config 配置生成目录的地址

```json
// dev
directories: {
    output: 'release_electron/${version}-dev/macOS/arm64'
},
// prod
directories: {
    output: 'release_electron/${version}-prod/macOS/arm64'
},
```