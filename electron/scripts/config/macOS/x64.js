const { appIdMap, nameMap } = require("../options");

module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: "com.electron.CTOTrader",
  productName: nameMap[process.env.NODE_ENV],
  extraMetadata: {
    name: appIdMap[process.env.NODE_ENV] // 缓存文件名字
  },
  directories: {
    output: "release_electron/${version}-${env.NODE_ENV}/macOS/x64",
  },
  extraResources: {
    from: "public/charting_library",
    to: "charting_library"
  },
  files: ["dist/**/*", "electron/**/*"],
  mac: {
    target: [
      { target: "dmg", arch: ["x64"] },
      { target: 'mas', arch: ['x64'] },
    ],
    // .dmg .pkg 安装包名字
    artifactName: '${productName}-Mac-${version}-${arch}.${ext}',

    icon: "build/icons/logo_512.png",

    // 签名
    identity: "Furong Uptech Solution Co., Limited (D322KZZJ5C)", // TYPE: Distribution; PLATFORM: All
    // 证书
    provisioningProfile: "build/ctotrader_electron_mac.provisionprofile", // TYPE: App Store; PLATFORM: macOS

    entitlements: "build/entitlements.plist",
    entitlementsInherit: "build/entitlements.inherit.plist",
    entitlementsLoginHelper: "build/entitlements.loginhelper.plist",
  },
  pkg: {
    identity: "Furong Uptech Solution Co., Limited (D322KZZJ5C)",
  },
  electronVersion: "34.0.2",
};
