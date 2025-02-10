module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: 'com.electron.wp-tradeview',
  asar: false,
  // asarUnpack: "public/charting_library",
  productName: 'UTrader',
  directories: {
    output: 'release_electron/${version}/windows/common'
  },
  extraResources: [{
    "from": "public",
    "to": "public"
  }],
  files: ["dist", "electron"],
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
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true
  },
  electronVersion: '34.0.2'
};
