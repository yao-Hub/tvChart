<template>
  <el-dropdown trigger="hover" placement="right-start">
    <div class="Fontsize">
      <div class="Fontsize_left">
        <BaseImg class="logo" iconName="icon_13" />
        <span>{{ t("font.fontSize") }}</span>
      </div>
      <div class="Fontsize_right">
        <el-text type="info">{{ t(`font.${sizeStore.systemSize}`) }}</el-text>
        <BaseImg class="logo" iconName="turnRight" />
      </div>
    </div>
    <template #dropdown>
      <Sizes></Sizes>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { useSize } from "@/store/modules/size";
import Sizes from "./Sizes.vue";
const sizeStore = useSize();
</script>

<style lang="scss" scoped>
.Fontsize {
  width: 200px;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &_left {
    display: flex;
    gap: 5px;
  }
  &_right {
    display: flex;
    gap: 5px;
  }
}
</style>
