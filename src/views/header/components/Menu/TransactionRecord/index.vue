<template>
  <el-dropdown trigger="hover" placement="right-start">
    <div class="transactionRecord">
      <div class="transactionRecord_left">
        <BaseImg class="logo" iconName="icon_22" />
        <span>{{ t("transactionRecord.title") }}</span>
      </div>
      <div class="transactionRecord_right">
        <BaseImg class="logo" iconName="turnRight" />
      </div>
    </div>
    <template #dropdown><Fields></Fields></template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();

import Fields from "./Fields.vue";
</script>

<style lang="scss" scoped>
.transactionRecord {
  width: 200px;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &_left {
    display: flex;
    gap: 5px;
    align-items: center;
  }
  &_right {
    display: flex;
    gap: 5px;
  }
}
</style>
