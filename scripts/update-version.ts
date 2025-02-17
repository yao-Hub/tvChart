import { readFileSync, writeFileSync } from "fs";
import inquirer from "inquirer";
import simpleGit, { SimpleGit } from "simple-git";

// 绿色 ANSI 转义序列
const greenColor = "\x1b[32m";
// 红色 ANSI 转义序列
const redColor = "\x1b[31m";
// 黄色 ANSI 转义序列
const yellowColor = "\x1b[33m";
// 重置颜色的 ANSI 转义序列
const resetColor = "\x1b[0m";

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
  const localParts = localVersion.replace("v", "").split(".").map(Number);
  const remoteParts = remoteVersion.replace("v", "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (localParts[i] > remoteParts[i]) {
      return false;
    }
  }
  return true;
}

// 是否可以更新
function canUpdate(
  inputVersion: string,
  remoteVersion: string | null | undefined
): boolean {
  if (!remoteVersion) return true;
  const inputParts = inputVersion.replace("v", "").split(".").map(Number);
  const remoteParts = remoteVersion.replace("v", "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (inputParts[i] > remoteParts[i]) {
      return true;
    }
  }
  return false;
}

// 获取版本
async function getUpdateVersion(
  localVersion: string,
  updateType: "patch" | "minor" | "major" | "custom",
  remoteVersion: string | null | undefined
): Promise<string> {
  if (updateType === "custom") {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "customVersion",
        message: "请输入自定义版本号:",
        validate: (input) => {
          const versionRegex = /^\d+(\.\d+){0,2}$/;
          if (!versionRegex.test(input)) {
            return `${redColor}×${resetColor} 请输入有效的版本号，格式如  x.y.z`;
          }
          const ifCanUpdate = canUpdate(input, remoteVersion);
          if (!ifCanUpdate) {
            return `${redColor}×${resetColor} 版本号小于远程版本号`;
          }
          return true;
        },
      },
    ]);
    return answers.customVersion;
  }
  const localParts = localVersion.split(".").map(Number);

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
  console.log(`${greenColor}√${resetColor} 本地版本号已更新为 ${version}`);
}

async function updateRemoteTag(version: string) {
  try {
    const git: SimpleGit = simpleGit();
    // 打标签
    await git.tag([`v${version}`]);
    // 推送标签到远程仓库
    await git.push(["origin", `v${version}`]);
    console.log(`****版本号 v${version} 已同步到远程仓库****`);
  } catch (error) {
    console.error("****同步版本号到远程仓库时出错:", error);
  }
}

// 主函数
async function main() {
  const packageJson = require("../package.json");
  const localVersion = packageJson.version;
  const git: SimpleGit = simpleGit();
  console.log("********版本号更新********");
  const remoteVersion = await getRemoteLatestTag(git);
  console.log("本地版本号: ", localVersion);
  console.log("远程版本号: ", remoteVersion);

  if (remoteVersion == null) {
    console.log(`${yellowColor}√${resetColor} 远程版本为空，同步本地版本`);
    updateRemoteTag(localVersion);
    return;
  }

  if (shouldUpdate(localVersion, remoteVersion)) {
    console.log(`${redColor}!${resetColor} 需要更新版本号`);
    console.log(
      `${yellowColor}?${resetColor} Patch:缺陷修复，代码的功能没有发生变化，例如，从 1.0.0 升级到 1.0.1。\n`
    );
    console.log(
      `${yellowColor}?${resetColor} Minor: 向后兼容的方式添加了新功能时，旧版本的代码在新版本中仍然可以正常运行，同时还能使用新添加的功能，例如，从 1.0.x 升级到 1.1.x \n`
    );
    console.log(
      `${yellowColor}?${resetColor} Major: 不兼容的 API 修改时，之前使用旧版本 API 的代码在升级到新版本后可能无法正常工作，例如，从 1.x.x 升级到 2.x.x。\n`
    );

    const versionOptions = [
      { name: "补丁版本更新 (Patch)", value: "patch" },
      { name: "小版本更新 (Minor)", value: "minor" },
      { name: "大版本更新 (Major)", value: "major" },
      { name: "自定义版本号 (custom)", value: "custom" },
    ];

    const answers = await inquirer.prompt<{
      versionType: "patch" | "minor" | "major" | "custom";
    }>([
      {
        type: "list",
        name: "versionType",
        message: "请选择版本更新规则:",
        choices: versionOptions,
      },
    ]);

    const updateType = answers.versionType;
    const updateVersion = await getUpdateVersion(
      localVersion,
      updateType,
      remoteVersion
    );
    updatePackageJsonVersion(updateVersion);
    updateRemoteTag(updateVersion);
  } else {
    console.log("****本地版本号已是最新，无需更新。****");
  }
}

main();
