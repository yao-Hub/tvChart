module.exports.default = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: 'com.electron.UTrader',
  asar: false,
  productName: "UTrader",
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
