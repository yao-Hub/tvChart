<template>
  <div class="checkUpdate" @click="checkUpdate">
    <BaseImg class="logo" iconName="icon_21" />
    <span>{{ t("checkUpdate") }}</span>
  </div>
</template>

<script setup lang="ts">
import { useVersion } from "@/store/modules/version";

import eventBus from "utils/eventBus";

import { useI18n } from "vue-i18n";
const { t } = useI18n();
const checkUpdate = () => {
  eventBus.emit("closeDropdown");
  useVersion().getUpdate();
};
</script>

<style lang="scss" scoped>
.checkUpdate {
  display: flex;
  gap: 5px;
}
</style>
