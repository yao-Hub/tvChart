<!-- 快捷交易 -->
<template>
  <el-tooltip :content="t('QuickTransactions')">
    <div
      class="iconbox"
      :class="[orderStore.ifQuick ? 'active' : 'noActive']"
      @click="handleClick"
    ></div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { useChartAction } from "@/store/modules/chartAction";
import { useOrder } from "@/store/modules/order";
import { useStorage } from "@/store/modules/storage";

const { t } = useI18n();

const storageStore = useStorage();
const chartActionStore = useChartAction();
const orderStore = useOrder();

const handleClick = () => {
  orderStore.ifQuick = !orderStore.ifQuick;
  storageStore.setItem("ifQuick", orderStore.ifQuick);
  chartActionStore.toggleOrderBtn(orderStore.ifQuick);
};
</script>

<style lang="scss" scoped>
[data-theme="light"] .noActive {
  background-image: url("@/assets/icons/light/icon_3.svg");
}
[data-theme="light"] .active {
  background-image: url("@/assets/icons/light/icon_3a.svg");
}

[data-theme="dark"] .noActive {
  background-image: url("@/assets/icons/dark/icon_3.svg");
}
[data-theme="dark"] .active {
  background-image: url("@/assets/icons/dark/icon_3a.svg");
}
</style>
