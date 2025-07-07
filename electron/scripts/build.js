const { execSync } = require('child_process');
const isWindows = process.platform === 'win32'; //是否为windows
console.log("platform---->", process.platform);

function runCommand(command) {
  execSync(command, { stdio: 'inherit' });
}

function main() {
  const mode = process.env.NODE_ENV;
  console.log("mode---->", mode);
  runCommand(`vite build --mode ${mode}`);
  runCommand(`npm run obfuscator`);
  if (isWindows) {
    console.log('\n', '/*********************** win7 ***********************/', '\n');
    runCommand('electron-builder --config electron/scripts/config/windows/x64-win7.js');
    console.log('\n', '/*********************** win7打包完成 ***********************/', '\n');

    console.log('\n', '/*********************** windows ***********************/', '\n');
    runCommand('electron-builder --config electron/scripts/config/windows/x64-common.js');
    console.log('\n', '/*********************** windows打包完成 ***********************/', '\n');
  } else {
    // console.log('\n', '/*********************** macOSx64 ***********************/', '\n');
    // runCommand('electron-builder --config electron/scripts/config/macOS/x64.js');
    // console.log('\n', '/*********************** macOSx64打包完成***********************/', '\n');

    // console.log('\n', '/*********************** macOSarm64 ***********************/', '\n');
    // runCommand('electron-builder --config electron/scripts/config/macOS/arm64.js');
    // console.log('\n', '/*********************** macOSarm64打包完成 ***********************/', '\n');

    console.log('\n', '/*********************** macOS common ***********************/', '\n');
    runCommand('electron-builder --config electron/scripts/config/macOS/common.js');
    console.log('\n', '/*********************** macOS common打包完成 ***********************/', '\n');
  }
}

main();
