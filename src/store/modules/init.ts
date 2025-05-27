import { defineStore } from "pinia";

import { useSize } from "./size";
import { useTheme } from "./theme";
import { useUser } from "./user";
import { useSystem } from "./system";

export const useInit = defineStore("init", () => {
  const init = async () => {
    await useSystem().getSystemInfo();
    useUser().initAccount(); // 账户信息
    useSize().initSize(); // 初始化字体大小
    useTheme().initTheme(); // 系统主题（亮色暗色）
  };

  function $reset() {}

  return { init, $reset };
});
