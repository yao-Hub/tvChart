<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { LANGUAGE_LIST, LOCALE_LIST } from "@/constants/common";
import { useTheme } from "@/store/modules/theme";

const themeStore = useTheme();
themeStore.currentTheme = window.localStorage.getItem("Theme") || "dark";
const theme = computed(() => {
  return themeStore.antDTheme;
});

// ant-design 国际化
const I18n = useI18n();
let { locale } = I18n;
const usedLocale = computed(() => {
  return LANGUAGE_LIST[locale.value as keyof typeof LANGUAGE_LIST];
});
dayjs.locale(LOCALE_LIST[locale.value as keyof typeof LOCALE_LIST]);
const getPopupContainer = (el: Element, dialogContext: any) => {
  if (dialogContext) {
    return dialogContext.getDialogWrap();
  } else {
    return document.body;
  }
};
</script>

<template>
  <a-config-provider
    :getPopupContainer="getPopupContainer"
    :locale="usedLocale"
    :theme="theme"
  >
    <router-view></router-view>
  </a-config-provider>
</template>

<style scoped></style>
