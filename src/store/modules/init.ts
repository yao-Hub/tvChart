import { defineStore } from "pinia";

import { useSize } from "./size";
import { useTheme } from "./theme";
import { useNetwork } from "./network";
import { useUser } from "./user";
import { useVersion } from "./version";

export const useInit = defineStore("init", () => {
  const init = async () => {
    useUser().initAccount(); // 账户信息
    useSize().initSize(); // 初始化字体大小
    useTheme().initTheme(); // 系统主题（亮色暗色）
    await useVersion().getDeviceId(); // 生成设备唯一id
    await useNetwork().getLines(); //  交易线路
  };

  function $reset() {}

  return { init, $reset };
});
