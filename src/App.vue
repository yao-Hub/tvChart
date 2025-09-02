<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";
import { useI18n } from "vue-i18n";

import { ElConfigProvider, ElMessage } from "element-plus";

import { LANGUAGE_LIST } from "@/constants/common";
import { sendTrack } from "@/utils/track";
import eventBus from "utils/eventBus";

import { useSize } from "@/store/modules/size";
import { useTheme } from "@/store/modules/theme";
import { useVersion } from "@/store/modules/version";
import { useChartInit } from "./store/modules/chartInit";
import { useSocket } from "./store/modules/socket";
import { useSystem } from "./store/modules/system";
import { useNetwork } from "./store/modules/network";

const sizeStore = useSize();
const systemStore = useSystem();

sizeStore.initSize(); // 初始化字体大小
useTheme().initTheme(); // 系统主题

// online socket初始化
watch(
  () => systemStore.systemInfo,
  (info) => {
    if (info && info.deviceId) {
      useSocket().onlineSocketInit();
    }
  },
  {
    deep: true,
    once: true,
  }
);

// 标志位：打点函数是否已执行
const trackSent = ref(false);
watch(
  () => [useNetwork().server, systemStore.systemInfo],
  () => {
    const info = systemStore.systemInfo;
    const server = useNetwork().server;
    if (trackSent.value) {
      return;
    }
    if (info && server) {
      useSocket().onlineSocketInit();
      // 启动打点
      sendTrack({
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
  const result = `${useChartInit().state.globalRefresh}`;
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
const handleVisibilityChange = () => {
  const state = document.visibilityState;
  if (state === "visible" && socketState.value === "disconnect") {
    socketState.value = "";
    // useChartInit().systemRefresh();
    location.reload();
  }
};

// 网络重新连接触发刷新
const ifOnline = ref(true);
const handleOnline = () => {
  if (!ifOnline.value) {
    ifOnline.value = true;
    location.reload();
    // useChartInit().systemRefresh();
  }
};
const handleOffline = () => {
  ifOnline.value = false;
  ElMessage.error({
    message: I18n.t("network offline"),
    duration: 3000,
  });
};

onMounted(() => {
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  if (OS_PLATFORM !== "darwin") {
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
  }
});
onUnmounted(() => {
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <el-config-provider :locale="locale" :size="sizeStore.systemSize">
    <router-view :key="freshKey"></router-view>
  </el-config-provider>
</template>

<style scoped></style>
