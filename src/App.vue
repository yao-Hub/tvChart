<script setup lang="ts">
import { computed } from "vue";
import { ElConfigProvider } from "element-plus";
import { useI18n } from "vue-i18n";
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";

import { LANGUAGE_LIST } from "@/constants/common";
import { useSize } from "@/store/modules/size";

const sizeStore = useSize();

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
