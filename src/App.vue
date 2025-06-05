<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";
import { useI18n } from "vue-i18n";

import { ElConfigProvider } from "element-plus";

import { LANGUAGE_LIST } from "@/constants/common";
import { sendTrack } from "@/utils/track";
import eventBus from "utils/eventBus";

import { useSize } from "@/store/modules/size";
import { useTheme } from "@/store/modules/theme";
import { useVersion } from "@/store/modules/version";
import { useUser } from "./store/modules/user";
import { useChartInit } from "./store/modules/chartInit";
import { useSocket } from "./store/modules/socket";
import { useSystem } from "./store/modules/system";

const sizeStore = useSize();
const systemStore = useSystem();

sizeStore.initSize(); // 初始化字体大小
useTheme().initTheme(); // 系统主题

// 标志位：打点函数是否已执行
const trackSent = ref(false);

// online socket初始化
watch(
  () => [systemStore.systemInfo, useUser().account.server],
  async () => {
    const info = systemStore.systemInfo;
    const server = useUser().account.server;
    if (info && info.deviceId) {
      useSocket().onlineSocketInit();
    }
    if (info && server && !trackSent.value) {
      await sendTrack({
        actionType: "open",
        actionObject: location.href,
      });
      trackSent.value = true;
    }
  },
  { deep: true }
);

// 国际化
const I18n = useI18n();

// 系统语言
const locale = computed(() => {
  const value = I18n.locale.value;
  return LANGUAGE_LIST[value as keyof typeof LANGUAGE_LIST];
});

// 刷新key
const freshKey = computed(() => {
  const result = `${locale.value.name}${useChartInit().state.globalRefresh}`;
  return result;
});

// 被动断开socket连接返回页面重新热更新页面
const socketState = ref("");
eventBus.on("socket-disconnect", () => {
  socketState.value = "disconnect";
});
eventBus.on("socket-connect", () => {
  socketState.value = "connect";
});
eventBus.on("socket-error", () => {
  socketState.value = "error";
});
const handleVisibilityChange = async () => {
  const state = document.visibilityState;
  if (state === "visible" && socketState.value === "disconnect") {
    useChartInit().systemRefresh();
  }
};

// 网络重新连接触发刷新
const networkStatus = ref(navigator.onLine);
const handleNetworkChange = () => {
  if (!networkStatus.value) {
    useChartInit().systemRefresh();
  }
  networkStatus.value = navigator.onLine;
};

onMounted(() => {
  window.addEventListener("online", handleNetworkChange);
  window.addEventListener("offline", handleNetworkChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  // 获取更新
  useVersion().getUpdate({
    status: [1, 2],
    ifCheckFrequency: true,
  });

  // electron 多语言传递
  window.electronAPI?.send("set-translations", {
    shutdown: I18n.t("update.shutdown"),
    cancel: I18n.t("cancel"),
    exitTip: I18n.t("update.exitTip"),
    downLoading: I18n.t("update.downloading"),
  });
  useVersion().subUpdate();
});
onUnmounted(() => {
  window.removeEventListener("online", handleNetworkChange);
  window.removeEventListener("offline", handleNetworkChange);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <el-config-provider :locale="locale" :size="sizeStore.systemSize">
    <router-view :key="freshKey"></router-view>
  </el-config-provider>
</template>

<style scoped></style>
