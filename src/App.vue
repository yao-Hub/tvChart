<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";
import { useI18n } from "vue-i18n";

import { ElConfigProvider } from "element-plus";

import { LANGUAGE_LIST } from "@/constants/common";
import { sendTrack } from "@/utils/track";

import { useSize } from "@/store/modules/size";
import { useTheme } from "@/store/modules/theme";
import { useVersion } from "@/store/modules/version";
import { useUser } from "./store/modules/user";
import { useChartInit } from "./store/modules/chartInit";

const sizeStore = useSize();

sizeStore.initSize(); // 初始化字体大小
useTheme().initTheme(); // 系统主题

// 打点
watch(
  () => useUser().account.server,
  () => {
    sendTrack({
      actionType: "open",
      actionObject: location.pathname,
    });
  },
  { once: true }
);

// 国际化
const I18n = useI18n();

// 系统语言
const locale = computed(() => {
  const value = I18n.locale.value;
  return LANGUAGE_LIST[value as keyof typeof LANGUAGE_LIST];
});

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
  // 获取更新
  setTimeout(
    () =>
      useVersion().getUpdate({
        status: [1, 2],
        ifCheckFrequency: true,
      }),
    1000
  );

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
});
</script>

<template>
  <el-config-provider :locale="locale" :size="sizeStore.systemSize">
    <router-view :key="locale.name"></router-view>
  </el-config-provider>
</template>

<style scoped></style>
