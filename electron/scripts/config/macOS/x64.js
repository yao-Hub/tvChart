module.exports.default = {
  $schema:
    "https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json",
  appId: 'com.electron.UTrader',
  asar: false,
  productName: "UTrader",
  directories: {
    output: "release_electron/${version}/macOS/x64",
  },
  extraResources: {
    from: "public",
    to: "public"
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
    icon: "public/logo_256.ico",
  },
  electronVersion: "34.0.2",
};
