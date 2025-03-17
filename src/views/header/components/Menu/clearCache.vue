<template>
  <div class="clearCache" @click="useStorage().removeNowUserStorage()">
    <BaseImg class="logo" iconName="icon_20" />
    <span>{{ t("clearCache") }}</span>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from "@/store/modules/storage";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>

<style lang="scss" scoped>
.clearCache {
  display: flex;
  gap: 5px;
}
</style>
