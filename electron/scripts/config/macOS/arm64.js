module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: "com.electron.CTOTrader",
  productName: "CTOTrader", // .app名字
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
    bundleVersion: "2",
    bundleShortVersion: process.env.npm_package_version,
    target: [
      // { target: 'dmg', arch: ['arm64'] },
      { target: 'mas', arch: ['arm64'] },
    ],
    // .dmg .pkg 安装包名字
    artifactName: '${productName}-Mac-${version}-${arch}.${ext}',

    minimumSystemVersion: '12.0', // 支持的mac最小系统版本
    icon: "build/icons/logo_1024.png", // 图标 1024 x 1024

    // 签名
    identity: "Furong Uptech Solution Co., Limited (D322KZZJ5C)", // TYPE: Mac Installer Distribution; PLATFORM: All
    // 证书
    provisioningProfile: "build/ctotrader_electron_mac.provisionprofile", // TYPE: App Store; PLATFORM: macOS

    // 三个权限文件
    entitlements: "build/entitlements.plist",
    entitlementsInherit: "build/entitlements.inherit.plist",
    entitlementsLoginHelper: "build/entitlements.loginhelper.plist",
  },
  electronVersion: '34.0.2'
};
