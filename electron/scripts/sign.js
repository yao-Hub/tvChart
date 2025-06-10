const { appIdMap } = require("./config/options");

const version = require("../../package.json").version;
const nodeEnv = process.env.NODE_ENV || "production";
const chip = process.env.chipFile || "arm64";
const chipFileMap = {
  "x64": "mac",
  "arm64": "mac-arm64"
}
const chipFile = chipFileMap[chip];
const appName = appIdMap[nodeEnv];

const appPath = `release_electron/${version}-${nodeEnv}/macOS/${chip}/${chipFile}/${appName}.app`;

// function getEntitlementsForFile(filePath) {
//   console.log(filePath)
//   return 'build/entitlements.plist';
// }

async function signApp() {
  const { sign, flat } = await import('@electron/osx-sign');

  // electron-builder打包完在给app添加签名
  // console.log('****开发.app添加签名...');
  // await sign({
  //   app: appPath,
  //   identity: 'Apple Development: luolin Tan (N3W2W6CHZ7)',
  //   optionsForFile: (filePath) => ({
  //     entitlements: getEntitlementsForFile(filePath),
  //   }),
  //   provisioningProfile: 'build/CTOTrader_Mac_Dev.provisionprofile',
  // });
  // console.log('****开发应用签名成功！****');

  // console.log('****生产.app添加签名...');
  // await sign({
  //   app: appPath,
  //   identity: 'Apple Distribution: Furong Uptech Solution Co., Limited (D322KZZJ5C)',
  //   provisioningProfile: 'build/CTOTrader_Mac_Prod.provisionprofile',
  //   optionsForFile: (filePath) => ({
  //     entitlements: getEntitlementsForFile(filePath),
  //   }),
  // });
  // console.log('生产应用签名成功！');

  // 生成包含证书的pkg安装包
  console.log('\n', `/**** ${appName}.app转化生成 ${appName}.pkg ....../`);
  await flat({
    app: appPath,
    identity: "3rd Party Mac Developer Installer: Furong Uptech Solution Co., Limited (D322KZZJ5C)",
  });
  console.log('\n', `/**** ${appName}.pkg生成成功！`);
}

signApp();
