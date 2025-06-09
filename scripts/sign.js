async function signApp() {

  // 给.app添加签名
  console.log('****给.app增加sign...');
  const { sign, flat } = await import('@electron/osx-sign');
  await sign({
    app: 'release_electron/1.0.2-production/macOS/arm64/mac-arm64/CTOTrader.app',
    identity: 'Mac Developer: luolin Tan (N3W2W6CHZ7)',
    provisioningProfile: 'build/MAC.provisionprofile',
    entitlements: "build/entitlements.plist", // 权限
    entitlementsInherit: "build/entitlements.plist",
  });
  console.log('应用签名成功！');

  // 生成包含证书的pkg安装包
  console.log('****把.app打包成.pkg...');
  await flat({
    app: 'release_electron/1.0.2-production/macOS/arm64/mac-arm64/CTOTrader.app',
    identity: "3rd Party Mac Developer Installer: Furong Uptech Solution Co., Limited (D322KZZJ5C)"
  });
  console.log('应用打包成功！');
}

signApp();
