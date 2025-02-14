import { readFileSync, writeFileSync } from "fs";
import inquirer from "inquirer";
import simpleGit, { SimpleGit } from "simple-git";

// 从远程仓库获取最新标签版本号
async function getRemoteLatestTag(
  git: SimpleGit
): Promise<string | null | undefined> {
  try {
    await git.fetch();
    const tags = await git.tags();
    return tags.latest;
  } catch (error) {
    console.error("获取远程标签时出错:", error);
    return null;
  }
}

// 比较版本号，判断是否需要更新
function shouldUpdate(
  localVersion: string,
  remoteVersion: string | null | undefined
): boolean {
  if (!remoteVersion) return true;
  const localParts = localVersion.split(".").map(Number);
  const remoteParts = remoteVersion.replace("v", "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (localParts[i] > remoteParts[i]) {
      return false;
    }
  }
  return true;
}

// 检查更新类型是否符合规则
function getUpdateVersion(
  localVersion: string,
  remoteVersion: string | null | undefined,
  updateType: "patch" | "minor" | "major"
): string {
  const localParts = localVersion.split(".").map(Number);
  const remoteParts = remoteVersion
    ? remoteVersion.split(".").map(Number)
    : localParts;

  const newParts = [...localParts];
  if (updateType === "patch") {
    newParts[2]++;
  } else if (updateType === "minor") {
    newParts[1]++;
    newParts[2] = 0;
  } else if (updateType === "major") {
    newParts[0]++;
    newParts[1] = 0;
    newParts[2] = 0;
  }
  return newParts.join(".");
}

// 更新 package.json 中的版本号
function updatePackageJsonVersion(version: string) {
  const packageJsonPath = "./package.json";
  const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(packageJsonContent);
  packageJson.version = version;
  const newPackageJsonContent = JSON.stringify(packageJson, null, 2);
  writeFileSync(packageJsonPath, newPackageJsonContent);
  // 绿色 ANSI 转义序列
  const greenColor = "\x1b[32m";
  // 重置颜色的 ANSI 转义序列
  const resetColor = "\x1b[0m";
  console.log(`${greenColor}√${resetColor} 版本号已更新为 ${version}`);
}

// 主函数
async function main() {
  const packageJson = require("../package.json");
  const localVersion = packageJson.version;
  const git: SimpleGit = simpleGit();
  const remoteVersion = await getRemoteLatestTag(git);
  console.log("本地版本号: ", localVersion);
  console.log("远程版本号: ", remoteVersion);

  if (shouldUpdate(localVersion, remoteVersion)) {
    console.log("****需要更新版本号****");
    const versionOptions = [
      { name: "补丁版本更新 (Patch)", value: "patch" },
      { name: "小版本更新 (Minor)", value: "minor" },
      { name: "大版本更新 (Major)", value: "major" },
    ];

    const answers = await inquirer.prompt<{
      versionType: "patch" | "minor" | "major";
    }>([
      {
        type: "list",
        name: "versionType",
        message: "请选择版本更新规则:",
        choices: versionOptions,
      },
    ]);

    const updateType = answers.versionType;
    const updateVersion = getUpdateVersion(
      localVersion,
      remoteVersion,
      updateType
    );
    updatePackageJsonVersion(updateVersion);
  } else {
    console.log("****本地版本号已是最新，无需更新。****");
  }
}

main();
