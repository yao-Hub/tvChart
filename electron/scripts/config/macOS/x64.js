const { appIdMap } = require("../options");

module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  asar: false,
  appId: appIdMap[process.env.NODE_ENV],
  productName: appIdMap[process.env.NODE_ENV],
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
      {
        target: "dmg",
        arch: ["x64"],
      },
      {
        target: 'pkg',
        arch: ["x64"],
      }
    ],
    artifactName: "${productName}-Mac-${version}-x64.${ext}",
    icon: "build/icons/logo_512.png",
    
    // 生产环境
    identity: "Apple Distribution: Furong Uptech Solution Co., Limited (D322KZZJ5C)",
    provisioningProfile: "build/CTOTrader_Mac_Prod.provisionprofile",

    // 开发环境
    // identity: "Apple Development: luolin Tan (N3W2W6CHZ7)",
    // provisioningProfile: "build/CTOTrader_Mac_Dev.provisionprofile'",

    entitlements: "build/entitlements.plist",
    entitlementsInherit: "build/entitlements.inherit.plist",
    entitlementsLoginHelper: "build/entitlements.loginhelper.plist",
  },
  pkg: {
    identity: "Furong Uptech Solution Co., Limited (D322KZZJ5C)",
  },
  electronVersion: "34.0.2",
};
