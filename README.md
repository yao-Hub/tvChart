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

## 上传 App Store的踩坑：
- [参考文章](https://juejin.cn/post/7412836534238085161)
- 在[苹果开发者平台](https://developer.apple.com/account)获取证书
- 将Certificates（cer）证书下载到本地并双击打开植入钥匙串，在钥匙串双击证书查看详情
- 将profile下载到本地并复制到项目
- 更新profile之后需要到xcode进行更新
    - 进入setting -> accounts -> Download Manual Profiles
    - 若点击Download Manual Profiles无效（需要的证书status提示不在钥匙串上），则点击+号可能生效
- 需要的证书：
    - 开发包：Apple Development（cer）masOS App Development(profile)
    - 生产包：Apple Distribution (cer) masOS App Store Connect(profile)
    - pkg: Installer(cer)
    - 一共是三个证书（cer）和两个profile，按需下载使用
- profile 与 cer需要匹配
    - 同样名字的cer的sha1是不一样的
    - profile在访达可以查看cer的sha1，需要与cer的sha1一样
- 配置证书有两种方式：
    - 通过打包配置文件直接配置identity（cer的主题名称的常用名称）和provisioningProfile（证书profile所在的本地文件地址）
    - 打完包在通过osx-sign添加证书
- 若提示xcode更新

- 权限配置
    - 配置entitlements属性，值为权限文件地址
    - 配置沙箱权限
    - 配置com.apple.application-identifier为当前appId
- 目前electron桌面端应用只支持上传.pkg
- 通过electron-builder打完包生成.app在去使用 osx-sign 把.app扁平化生成.pkg
- 将.pkg通过transporter上传到App Store
