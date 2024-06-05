<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { theme } from 'ant-design-vue';
import { LANGUAGE_LIST } from '@/constants/common';
import { computed } from "vue";
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// ant-design 国际化
const I18n = useI18n();
let { locale } = I18n;
const usedLocale = computed(() => {
  return LANGUAGE_LIST[locale.value as keyof typeof LANGUAGE_LIST];
})
dayjs.locale(locale.value);
const getPopupContainer = (el: Element, dialogContext: any) => {
  if (dialogContext) {
    return dialogContext.getDialogWrap();
  } else {
    return document.body;
  }
}
</script>

<template>
  <a-config-provider :getPopupContainer="getPopupContainer" :locale="usedLocale" :theme="{
    algorithm: theme.darkAlgorithm,
  }">
    <router-view></router-view>
  </a-config-provider>
</template>

<style scoped></style>
