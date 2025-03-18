module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: 'com.electron.UTrader',
  asar: false,
  productName: 'UTrader',
  directories: {
    output: 'release_electron/${version}/macOS/arm64'
  },
  extraResources: {
    from: "public/charting_library",
    to: "charting_library"
  },
  files: ["dist/**/*", "electron/**/*"],
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['arm64']
      }
    ],
    artifactName: '${productName}-Mac-${version}-arm64.${ext}',
    icon: 'public/logo_512.png',
    // entitlements: "entitlements.plist", // 创建权限文件
    // entitlementsInherit: "entitlements.plist",
    identity: null,  // 禁用签名
  },
  electronVersion: '34.0.2'
};
