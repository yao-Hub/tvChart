const { execSync } = require('child_process');
const isWindows = process.platform === 'win32'; //是否为windows
console.log("platform---->", process.platform);

function runCommand(command) {
  execSync(command, { stdio: 'inherit' });
}

function playCompletionSound() {
  // 直接指向项目根目录下的音频文件
  const soundDir = path.join(__dirname, "assets");
  const soundFile = path.join(soundDir, "张韶涵-不害怕.wav");
  const isWindows = process.platform === "win32";

  try {
    if (isWindows) {
      execSync(
        `powershell -c "(New-Object Media.SoundPlayer '${soundFile}').PlaySync()"`,
        { stdio: "inherit" }
      );
    } else {
      execSync(`afplay "${soundFile}"`, { stdio: "inherit" });
    }
  } catch (error) {
    console.error("播放失败:", error);
  }
}

function main() {
  const mode = process.env.NODE_ENV;
  console.log("mode---->", mode);
  runCommand(`vite build --mode ${mode}`);
  if (isWindows) {
    // console.log('\n', '/*********************** win7 ***********************/', '\n');
    // runCommand('electron-builder --config ./electron/scripts/config/windows/x64-win7.js');
    // console.log('\n', '/*********************** win7打包完成 ***********************/', '\n');

    console.log('\n', '/*********************** windows ***********************/', '\n');
    runCommand('electron-builder --config ./electron/scripts/config/windows/x64-common.js');
    console.log('\n', '/*********************** windows打包完成 ***********************/', '\n');
  } else {
    // console.log('\n', '/*********************** macOSx64 ***********************/', '\n');
    // runCommand('electron-builder --config ./electron/scripts/config/macOS/x64.js');
    // console.log('\n', '/*********************** macOSx64打包完成***********************/', '\n');

    console.log('\n', '/*********************** macOSarm64 ***********************/', '\n');
    runCommand('electron-builder --config ./electron/scripts/config/macOS/arm64.js');
    console.log('\n', '/*********************** macOSarm64打包完成 ***********************/', '\n');
  }
  playCompletionSound();
}

main();
