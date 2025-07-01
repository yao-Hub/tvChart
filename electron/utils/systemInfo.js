const { exec } = require("child_process");
const os = require("os");
const fs = require("fs");

// 通用解析工具函数
const parsers = {
  /**
   * 解析 Windows 注册表输出
   * @param {string} output 命令输出
   * @param {string} key 要查找的注册表键
   * @returns {string|null} 解析后的值
   */
  windowsRegistry(output, key) {
    // 支持多种格式：
    // 1. "    MachineGuid    REG_SZ    xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    // 2. "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography\n    MachineGuid    REG_SZ    xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    const regex = new RegExp(`${key}\\s+\\w+\\s+(\\S[^\\r\\n]*)`, 'i');
    const match = output.match(regex);
    return match ? match[1].trim() : null;
  },

  /**
   * 解析 WMIC 输出
   * @param {string} output 命令输出
   * @returns {string|null} 解析后的值
   */
  wmic(output) {
    // 处理可能的 UTF-16 LE 编码
    const text = output.includes('\u0000')
      ? output.replace(/\u0000/g, '')
      : output;

    // 清理并分割行
    const lines = text.split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line);

    // 返回第二行（第一行是标题）
    return lines.length > 1 ? lines[1] : null;
  },

  /**
   * 解析 macOS grep 输出
   * @param {string} output 命令输出
   * @param {string} key 要查找的键
   * @returns {string|null} 解析后的值
   */
  macGrep(output, key) {
    // 支持格式：
    // 1. "  "IOPlatformUUID" = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx""
    // 2. "Model Name: MacBook Pro"
    const regex = new RegExp(`"${key}"\\s*=\\s*"([^"]+)"|${key}:\\s*(.+)`, 'i');
    const match = output.match(regex);
    return match ? (match[1] || match[2]).trim() : null;
  },

  /**
   * 解析系统文件内容
   * @param {string} content 文件内容
   * @returns {string} 清理后的值
   */
  fileContent(content) {
    return content.trim();
  }
};

// 更新命令选项配置
const commandOptions = {
  uuid: {
    win32: [
      {
        cmd: `wmic csproduct get uuid`,
        parser: parsers.wmic
      },
      {
        cmd: `powershell -Command "Get-WmiObject Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID"`,
        parser: stdout => stdout.trim()
      },
      {
        cmd: `reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid`,
        parser: stdout => parsers.windowsRegistry(stdout, 'MachineGuid')
      },
      {
        cmd: `reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Wow6432Node\\Microsoft\\Cryptography" /v MachineGuid`,
        parser: stdout => parsers.windowsRegistry(stdout, 'MachineGuid')
      }
    ],
    darwin: [
      {
        cmd: 'ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID',
        parser: stdout => parsers.macGrep(stdout, 'IOPlatformUUID')
      }
    ],
    linux: [
      {
        cmd: '/var/lib/dbus/machine-id',
        type: 'file',
        parser: parsers.fileContent
      },
      {
        cmd: '/etc/machine-id',
        type: 'file',
        parser: parsers.fileContent
      }
    ]
  },
  manufacturer: {
    win32: [
      {
        cmd: `wmic computersystem get manufacturer`,
        parser: parsers.wmic
      },
      {
        cmd: `powershell -Command "Get-WmiObject Win32_ComputerSystem | Select-Object -ExpandProperty Manufacturer"`,
        parser: stdout => stdout.trim()
      },
      {
        cmd: `reg query "HKEY_LOCAL_MACHINE\\HARDWARE\\DESCRIPTION\\System\\BIOS" /v SystemManufacturer`,
        parser: stdout => parsers.windowsRegistry(stdout, 'SystemManufacturer')
      }
    ],
    darwin: [
      {
        cmd: 'system_profiler SPHardwareDataType | grep "Manufacturer"',
        parser: stdout => parsers.macGrep(stdout, 'Manufacturer')
      },
      {
        cmd: 'sysctl -n hw.model',
        parser: stdout => stdout.trim()
      }
    ],
    linux: [
      {
        cmd: 'dmidecode -s system-manufacturer',
        parser: stdout => stdout.trim()
      },
      {
        cmd: '/sys/class/dmi/id/sys_vendor',
        type: 'file',
        parser: parsers.fileContent
      }
    ]
  },
  model: {
    win32: [
      {
        cmd: `wmic computersystem get model`,
        parser: parsers.wmic
      },
      {
        cmd: `powershell -Command "Get-WmiObject Win32_ComputerSystem | Select-Object -ExpandProperty Model"`,
        parser: stdout => stdout.trim()
      },
      {
        cmd: `reg query "HKEY_LOCAL_MACHINE\\HARDWARE\\DESCRIPTION\\System\\BIOS" /v SystemProductName`,
        parser: stdout => parsers.windowsRegistry(stdout, 'SystemProductName')
      }
    ],
    darwin: [
      {
        cmd: 'system_profiler SPHardwareDataType | grep "Model Name"',
        parser: stdout => parsers.macGrep(stdout, 'Model Name')
      },
      {
        cmd: 'sysctl -n hw.model',
        parser: stdout => stdout.trim()
      }
    ],
    linux: [
      {
        cmd: '/sys/class/dmi/id/product_name',
        type: 'file',
        parser: parsers.fileContent
      },
      {
        cmd: 'dmidecode -s system-product-name',
        parser: stdout => stdout.trim()
      }
    ]
  }
};

/**
 * 通用执行函数（支持多方案）
 */
function executeWithFallback(platform, type) {
  return new Promise((resolve, reject) => {
    const commands = commandOptions[type][platform];

    if (!commands || commands.length === 0) {
      reject(new Error(`Unsupported platform for ${type}`));
      return;
    }

    const tryNextOption = (index) => {
      if (index >= commands.length) {
        reject(new Error(`All ${type} methods failed for ${platform}`));
        return;
      }

      const { cmd, parser, type: cmdType = 'command' } = commands[index];

      // 处理文件读取
      if (cmdType === 'file') {
        fs.readFile(cmd, 'utf8', (err, data) => {
          if (err) {
            tryNextOption(index + 1);
          } else {
            try {
              resolve(parser(data));
            } catch (parseError) {
              tryNextOption(index + 1);
            }
          }
        });
      }
      // 处理命令执行
      else {
        exec(cmd, (error, stdout, stderr) => {
          // 特殊处理：注册表查询在找不到路径时不视为致命错误
          const isRegistryError = cmd.startsWith('reg query') &&
            (stderr || '').includes('ERROR:');

          if (error || !stdout || isRegistryError) {
            tryNextOption(index + 1);
            return;
          }

          try {
            const result = parser(stdout.toString());
            if (result) {
              resolve(result);
            } else {
              tryNextOption(index + 1);
            }
          } catch (parseError) {
            tryNextOption(index + 1);
          }
        });
      }
    };

    tryNextOption(0);
  });
}

// 获取设备唯一标识符
function getDeviceUUID() {
  return executeWithFallback(os.platform(), 'uuid');
}

// 获取设备制造商
function getDeviceManufacturer() {
  return executeWithFallback(os.platform(), 'manufacturer');
}

// 获取设备型号
function getDeviceModel() {
  return executeWithFallback(os.platform(), 'model');
}

/**
 * 获取所有设备信息
 */
async function getDeviceInfo() {
  try {
    const [uuid, model, manufacturer] = await Promise.all([
      getDeviceUUID(),
      getDeviceModel(),
      getDeviceManufacturer(),
    ]);
    return {
      uuid,
      model,
      manufacturer,
      os: os.platform(),
      arch: os.arch(),
      release: os.release(),
      error: null,
    };
  } catch (error) {
    return {
      error: error.message || 'Failed to retrieve device information',
    };
  }
}

module.exports = { getDeviceInfo };
