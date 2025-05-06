import { defineStore } from "pinia";

import { useSize } from "./size";
import { useTheme } from "./theme";
import { useUser } from "./user";
import { useVersion } from "./version";

export const useInit = defineStore("init", () => {
  const init = async () => {
    useUser().initAccount(); // 账户信息
    useSize().initSize(); // 初始化字体大小
    useTheme().initTheme(); // 系统主题（亮色暗色）
    useVersion().getDeviceId(); // 生成设备唯一id
  };

  function $reset() {}

  return { init, $reset };
});
