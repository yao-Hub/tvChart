const appPath = "release_electron/1.0.2-production/macOS/arm64/mac-arm64/CTOTrader.app";

function getEntitlementsForFile(filePath) {
  console.log(filePath)
  return 'build/entitlements.plist';
}
// 给.app添加签名
async function signApp() {
  const { sign, flat } = await import('@electron/osx-sign');
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

  console.log('****生产.app添加签名...');
  await sign({
    app: appPath,
    identity: 'Apple Distribution: Furong Uptech Solution Co., Limited (D322KZZJ5C)',
    provisioningProfile: 'build/CTOTrader_Mac_Prod.provisionprofile',
    // provisioningProfile: 'build/CTOTrader_Mac_Installer.mobileprovision',
    optionsForFile: (filePath) => ({
      entitlements: getEntitlementsForFile(filePath),
    }),
  });
  console.log('生产应用签名成功！');

  // 生成包含证书的pkg安装包
  console.log('****把.app打包成.pkg...');
  await flat({
    app: appPath,
    identity: "3rd Party Mac Developer Installer: Furong Uptech Solution Co., Limited (D322KZZJ5C)",
  });
  console.log('应用打包成功！');
}

signApp();
