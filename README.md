# Utrader

vue3 + vite + electron

## 运行注意事项

- 需要使用electron时，只能使用npm

## 打包注意事项
- 打包Mac的appId配置需要与平台的id一致，Windows可随意
- 上架Mac商店目前只支持pkg，dmg包只适合不上架的方式
- 由于mac的芯片不同，需要的包(x86_64/arm64)版本和格式不同，通过 electron/config/macOS 配置生成不同的包
- 若只要打包arm64的包，则需要配置最低版本号（12.0.0）
- 通用的包要打通用二进制包（arch: universal）
- 当打包生成mac的dmg包时，不在本机安装应用时，需要运行dmg包完成安装后，打开term终端输入指令
```bash
sudo xattr -rd com.apple.quarantine /Applications/CTOTrader.app
```

## 上架 MacOS 踩坑：
- 打包之后若想在打包的本机上安装test fight的app，需要删除打包生成的.app包
- 通过设置bundleVersion就可以升级包的小版本（build），不用修改package.json的版本号
- 在[苹果开发者平台](https://developer.apple.com/account)获取证书
- ！！！上传到test fight/App Store需要的证书：
    - 不用考虑开发证书（TYPE包含development的所有证书）
    - Certificates(TYPE: Mac Installer Distribution; PLATFORM: macOS)
    - Profiles(TYPE: App Store; PLATFORM: macOS)
    - 将 Certificates 证书下载到本地并双击打开植入钥匙串
    - 将 Profiles 下载到本地并复制到项目
    - 有新的 Profiles 需要更新证书：打开 Xcode 在setting->Accounts->点击当前登录账户->Download Manual Profiles
- 配置证书：
    - identity：双击钥匙串证书获取Certificates的常用名称
    - provisioningProfile：profile本地路径
- 权限配置
    - entitlements.plis 配置com.apple.security.application-groups为(团队id).(包id)
