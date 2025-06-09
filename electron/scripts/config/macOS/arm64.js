const { appIdMap, nameMap } = require("../options");

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
    identity: "Mac Developer: luolin Tan (N3W2W6CHZ7)",
    provisioningProfile: "build/MAC.provisionprofile", // profile
    entitlements: "build/entitlements.plist", // 权限
    entitlementsInherit: "build/entitlements.plist",
  },
  pkg: {
    identity: "Furong Uptech Solution Co., Limited (D322KZZJ5C)",
  },
  electronVersion: '34.0.2'
};
