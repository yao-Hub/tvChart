const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * 获取设备唯一标识符
 */
function getDeviceUUID() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows: 获取主板序列号
      exec('wmic csproduct get uuid', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const uuid = stdout.toString().split('\n')[1].trim();
        resolve(uuid);
      });
    } else if (platform === 'darwin') {
      // macOS: 获取硬件 UUID
      exec('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const uuid = stdout.toString().split('"')[1];
        resolve(uuid);
      });
    } else if (platform === 'linux') {
      // Linux: 读取机器 ID
      const machineIdPath = '/var/lib/dbus/machine-id';
      fs.readFile(machineIdPath, 'utf8', (error, data) => {
        if (error) {
          // 尝试备用路径
          const altPath = '/etc/machine-id';
          fs.readFile(altPath, 'utf8', (err, altData) => {
            if (err) {
              reject(err);
            } else {
              resolve(altData.trim());
            }
          });
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
 * 获取设备型号
 */
function getDeviceModel() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows: 获取系统型号
      exec('wmic computersystem get model', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const model = stdout.toString().split('\n')[1].trim();
        resolve(model);
      });
    } else if (platform === 'darwin') {
      // macOS: 获取型号信息
      exec('system_profiler SPHardwareDataType | grep "Model Name"', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const model = stdout.toString().split(':')[1].trim();
        resolve(model);
      });
    } else if (platform === 'linux') {
      // Linux: 读取产品名称
      const modelPath = '/sys/class/dmi/id/product_name';
      fs.readFile(modelPath, 'utf8', (error, data) => {
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
 * 获取设备类型
 */
function getDeviceType() {
  const platform = os.platform();
  const isDesktop = os.totalmem() > 1024 * 1024 * 512; // 512MB 以上视为桌面设备

  if (platform === 'win32') {
    return isDesktop ? 'Desktop' : 'Laptop';
  } else if (platform === 'darwin') {
    return isDesktop ? 'Mac Desktop' : 'Mac Laptop';
  } else if (platform === 'linux') {
    return isDesktop ? 'Linux Desktop' : 'Linux Laptop';
  } else {
    return 'Unknown';
  }
}

/**
 * 获取所有设备信息
 */
async function getDeviceInfo() {
  try {
    const [uuid, model, type] = await Promise.all([
      getDeviceUUID(),
      getDeviceModel(),
      getDeviceType()
    ]);

    return {
      uuid,
      model,
      type,
      os: os.platform(),
      arch: os.arch(),
      release: os.release()
    };
  } catch (error) {
    console.error('Failed to get device info:', error);
    return {
      error: error.message
    };
  }
}

module.exports = { getDeviceInfo };