const nameMap = {
  staging: "CTOTrader staging",
  development: "CTOTrader dev",
  production: "CTOTrader",
};
const appIdMap = {
  staging: "com.electron.CTOTrader_staging",
  development: "com.electron.CTOTrader_dev",
  production: "com.electron.CTOTrader",
};

module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: appIdMap[process.env.NODE_ENV],
  productName: nameMap[process.env.NODE_ENV],
  extraMetadata: {
    name: nameMap[process.env.NODE_ENV] // 缓存文件名字
  },
  asar: false,
  directories: {
    output: 'release_electron/${version}-${env.NODE_ENV}/macOS/arm64'
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
      },
      {
        target: 'pkg',
        arch: ['arm64'],
      },
    ],
    minimumSystemVersion: '12.0',
    artifactName: '${productName}-Mac-${version}-arm64.${ext}',
    icon: 'public/logo_512.png',
    entitlements: "entitlements.plist",
    entitlementsInherit: "entitlements.child.plist",
    hardenedRuntime: true,
    gatekeeperAssess: false,
  },
  electronVersion: '34.0.2'
};
