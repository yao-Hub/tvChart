module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: '',
  asar: false,
  productName: 'wp-tradeview',
  directories: {
    output: 'release_electron/${version}/windows/common'
  },
  extraResources: {
    from: "public/charting_library",
    to: "../charting_library"
  },
  // publish: [
  //   {
  //     provider: 'generic',
  //     url: 'https://web-wsh.weishouhou.cn/electron/windows/common'
  //   }
  // ],
  files: ["dist/**/*", "electron/**/*"],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    artifactName: '${productName}-Windows-${version}-x64.${ext}',
    icon: 'public/logo_256.ico'
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
    uninstallDisplayName: '卸载-${productName}',
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true
  },
  electronVersion: '34.0.2'
};
