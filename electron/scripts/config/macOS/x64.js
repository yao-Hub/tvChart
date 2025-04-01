const nameMap = {
  test: "UTrader dev",
  production: "UTrader",
};
const appIdMap = {
  test: "com.electron.UTrader_dev",
  production: "com.electron.UTrader",
};

module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  asar: false,
  appId: appIdMap[process.env.NODE_ENV],
  productName: nameMap[process.env.NODE_ENV],
  extraMetadata: {
    name: nameMap[process.env.NODE_ENV] // 缓存文件名字
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
    ],
    artifactName: "${productName}-Mac-${version}-x64.${ext}",
    icon: "public/logo_512.png",
  },
  electronVersion: "34.0.2",
};
