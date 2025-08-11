const { appIdMap, nameMap, getFormattedTime } = require("../options");

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
    output: 'release_electron/${version}-${env.NODE_ENV}/macOS/arm64'
  },
  // 资源放置路径
  extraResources: {
    from: "public/charting_library",
    to: "charting_library"
  },
  files: ["dist/**/*", "electron/**/*"],
  mac: {
    target: [
      { target: 'dmg', arch: ['arm64'] },
      { target: 'mas', arch: ['arm64'] },
    ],
    // .dmg .pkg 安装包名字
    artifactName: (() => {
      if (process.env.NODE_ENV === "development") {
        const time = getFormattedTime();
        return '${productName}-Mac-${version}-${arch}-' + time + '.${ext}';
      }
      return '${productName}-Mac-${version}-${arch}.${ext}';
    })(),
    minimumSystemVersion: '12.0', // 支持的mac最小系统版本
    icon: "build/icons/logo_1024.png", // 图标 1024 x 1024

    // 生产环境
    identity: "Furong Uptech Solution Co., Limited (D322KZZJ5C)", // install cer 钥匙串证书名字
    provisioningProfile: "build/CTOTrader_Mac_Prod.provisionprofile", // masOS App Store Connect(profile)

    // 开发环境
    // identity: "Apple Development: luolin Tan (N3W2W6CHZ7)",
    // provisioningProfile: "build/CTOTrader_Mac_Dev.provisionprofile'",

    // 三个权限文件
    entitlements: "build/entitlements.plist",
    entitlementsInherit: "build/entitlements.inherit.plist",
    entitlementsLoginHelper: "build/entitlements.loginhelper.plist",
  },
  electronVersion: '34.0.2'
};
