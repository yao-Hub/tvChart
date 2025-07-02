const { appIdMap, nameMap } = require("../options");

module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: appIdMap[process.env.NODE_ENV],
  asar: true,
  productName: nameMap[process.env.NODE_ENV], // 输出包前缀名称 | 缓存文件名称、安装名称、路径名称
  extraMetadata: {
    name: nameMap[process.env.NODE_ENV] // 缓存文件名称、安装名称、路径名称 （优先级 > productName）
  },
  directories: {
    output: 'release_electron/${version}-${env.NODE_ENV}/windows/x64-common' // 安装包输出文件路径
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
    artifactName: '${productName}-Windows-${version}-x64-common.${ext}',
    icon: 'build/icons/logo.png'
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
  // windows 7 
  electronVersion: '21.4.4'
};
