<script setup lang="ts">
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";
import { ElConfigProvider } from "element-plus";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { LANGUAGE_LIST } from "@/constants/common";
import { sendTrack } from "@/utils/track";

import { useSize } from "@/store/modules/size";
import { useTheme } from "@/store/modules/theme";
import { useVersion } from "@/store/modules/version";

const sizeStore = useSize();

sizeStore.initSize(); // 初始化字体大小
useTheme().initTheme(); // 系统主题
useVersion().getDeviceId(); // 生成设备唯一id

sendTrack({
  actionType: "open",
  actionObject: location.pathname,
});

// 国际化
const I18n = useI18n();
const value = I18n.locale.value as keyof typeof LANGUAGE_LIST;

// 系统语言
const locale = computed(() => {
  return LANGUAGE_LIST[value];
});
</script>

<template>
  <el-config-provider :locale="locale" :size="sizeStore.systemSize">
    <router-view></router-view>
  </el-config-provider>
</template>

<style scoped></style>
