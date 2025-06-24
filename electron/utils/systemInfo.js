const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');

const commandOptions = {
  uuid: {
    win32: `powershell -Command "Get-WmiObject Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID"`,
    darwin: 'ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID',
    linux: ['/var/lib/dbus/machine-id', '/etc/machine-id']
  },
  manufacturer: {
    win32: `powershell -Command "Get-WmiObject Win32_ComputerSystem | Select-Object -ExpandProperty Manufacturer"`,
    darwin: 'system_profiler SPHardwareDataType | grep "Manufacturer"',
    linux: 'dmidecode -s system-manufacturer'
  },
  model: {
    win32: `powershell -Command "Get-WmiObject Win32_ComputerSystem | Select-Object -ExpandProperty Model"`,
    darwin: 'system_profiler SPHardwareDataType | grep "Model Name"',
    linux: '/sys/class/dmi/id/product_name'
  }
};

/**
 * 获取设备唯一标识符
 */
function getDeviceUUID() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows: 获取主板序列号
      exec(commandOptions.uuid.win32, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout.toString().trim());
      });
    } else if (platform === 'darwin') {
      // macOS: 获取硬件 UUID
      exec(commandOptions.uuid.darwin, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const uuid = stdout.toString().split('=')[1];
        resolve(uuid);
      });
    } else if (platform === 'linux') {
      // Linux: 读取机器 ID
      const readMachineId = (path, fallbackPath) => {
        fs.readFile(path, 'utf8', (err, data) => {
          if (err) {
            if (fallbackPath) {
              readMachineId(fallbackPath, null);
            } else {
              reject(err);
            }
          } else {
            resolve(data.trim());
          }
        });
      };
      readMachineId(...commandOptions.uuid.linux);
    } else {
      reject(new Error('Unsupported platform'));
    }
  });
}

// 获取设备制造商
function getDeviceManufacturer() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    if (platform === 'win32') {
      exec(commandOptions.manufacturer.win32, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout.toString().trim());
      });
    } else if (platform === 'darwin') {
      exec(commandOptions.manufacturer.darwin, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const manufacturer = stdout.trim().split(': ')[1]; // 提取冒号后的内容
        resolve(manufacturer);
      });
    } else if (platform === 'linux') {
      exec(commandOptions.manufacturer.linux, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const manufacturer = stdout.trim();
        resolve(manufacturer);

      });
    } else {
      reject(new Error('Unsupported platform'));
    }
  });
}

/**
 * 获取设备型号
 */
function getDeviceModel() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows: 获取系统型号
      exec(commandOptions.model.win32, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout.toString().trim());
      });
    } else if (platform === 'darwin') {
      // macOS: 获取型号信息
      exec(commandOptions.model.darwin, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const model = stdout.toString().split(':')[1].trim();
        resolve(model);
      });
    } else if (platform === 'linux') {
      // Linux: 读取产品名称
      fs.readFile(commandOptions.model.linux, 'utf8', (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data.trim());
        }
      });
    } else {
      reject(new Error('Unsupported platform'));
    }
  });
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
      release: os.release()
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

module.exports = { getDeviceInfo };