
const nameMap = {
  test: "CTOTrader dev",
  production: "CTOTrader",
};
const appIdMap = {
  test: "com.electron.CTOTrader_dev",
  production: "com.electron.CTOTrader",
};

module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: appIdMap[process.env.NODE_ENV],
  asar: false,
  productName: nameMap[process.env.NODE_ENV], // 安装名字 路径名字
  extraMetadata: {
    name: nameMap[process.env.NODE_ENV] // 缓存文件名字
  },
  directories: {
    output: 'release_electron/${version}-${env.NODE_ENV}/windows/common' // 安装包输出文件路径
  },
  extraResources: {
    from: "public/charting_library",
    to: "charting_library"
  },
  files: ["dist", "electron"],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    artifactName: '${productName}-Windows-${version}-x64.${ext}',
    icon: 'public/logo_bg.png'
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true
  },
  electronVersion: '34.0.2'
};
