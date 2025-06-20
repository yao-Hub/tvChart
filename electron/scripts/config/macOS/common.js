const { appIdMap, nameMap } = require("../options");

module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: appIdMap[process.env.NODE_ENV],
  productName: nameMap[process.env.NODE_ENV], // .app名字
  // 元信息：更改或者增加已有的设定
  extraMetadata: {
    name: appIdMap[process.env.NODE_ENV], // 缓存文件名字
  },
  // 打包文件输出路径
  directories: {
    output: 'release_electron/${version}-${env.NODE_ENV}/macOS/common'
  },
  // 资源放置路径
  extraResources: {
    from: "public/charting_library",
    to: "charting_library"
  },
  files: ["dist/**/*", "electron/**/*"],
  mac: {
    target: [
      // 生成通用二进制包
      { target: 'mas', arch: ['universal'] }
    ],
    hardenedRuntime: true, // 必须为MAS启用硬编码运行时

    artifactName: '${productName}-Mac-${version}-${arch}.${ext}', // .dmg .pkg 安装包名字
    icon: "build/icons/logo_1024.png", // 图标 1024 x 1024

    identity: "Furong Uptech Solution Co., Limited (D322KZZJ5C)", // install cer 钥匙串证书名字
    provisioningProfile: "build/CTOTrader_Mac_Prod.provisionprofile", // masOS App Store Connect(profile)

    // 三个权限文件
    entitlements: "build/entitlements.plist",
    entitlementsInherit: "build/entitlements.inherit.plist",
    entitlementsLoginHelper: "build/entitlements.loginhelper.plist",
  },
  electronVersion: '34.0.2'
};
