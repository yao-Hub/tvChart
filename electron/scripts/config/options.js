const nameMap = {
  staging: "CTOTrader_staging",
  development: "CTOTrader_dev",
  production: "CTOTrader",
};
const appIdMap = {
  staging: "com.electron.CTOTrader_staging",
  development: "com.electron.CTOTrader_dev",
  production: "com.electron.CTOTrader",
};

function getFormattedTime() {
  const date = new Date();

  // 获取月份（0-11，需要+1）并补零
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // 获取日期并补零
  const day = String(date.getDate()).padStart(2, '0');

  // 获取小时并补零
  const hours = String(date.getHours()).padStart(2, '0');

  // 获取分钟并补零
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // 组合成MMDD_HHmm格式
  return `${month}${day}_${hours}${minutes}`;
}

module.exports = { nameMap, appIdMap, getFormattedTime };