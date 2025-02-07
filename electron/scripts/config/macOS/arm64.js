module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: '',
  asar: false,
  productName: 'wp-tradeview',
  directories: {
    output: 'release_electron/${version}/macOS/arm64'
  },
  extraResources: {
    from: "public/charting_library",
    to: "../charting_library"
  },
  // publish: [
  //   {
  //     provider: 'generic',
  //     url: 'https://web-wsh.weishouhou.cn/electron/macOS/arm64'
  //   }
  // ],
  files: ["dist/**/*", "electron/**/*"],
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['arm64']
      }
    ],
    artifactName: '${productName}-Mac-${version}-arm64.${ext}',
    icon: 'public/logo_256.ico'
  },
  electronVersion: '34.0.2'
};
