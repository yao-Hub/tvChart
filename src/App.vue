<script setup lang="ts">
import { computed } from "vue";
import { LANGUAGE_LIST } from "@/constants/common";
import { ElConfigProvider } from "element-plus";
import { useI18n } from "vue-i18n";
import { useTheme } from "@/store/modules/theme";
import { useSize } from "@/store/modules/size";
const themeStore = useTheme();
const sizeStore = useSize();

const I18n = useI18n();
const locale = computed(() => {
  return LANGUAGE_LIST[I18n.locale.value];
});

themeStore.initTheme();
</script>

<template>
  <el-config-provider :locale="locale" :size="sizeStore.systemSize">
    <router-view></router-view>
  </el-config-provider>
</template>

<style scoped></style>
