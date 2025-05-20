<!-- 快捷交易 -->
<template>
  <el-tooltip :content="t('quickTrade.title')">
    <div class="iconbox" @click="handleClick">
      <BaseImg
        :iconName="orderStore.state.ifQuick ? 'icon_3a' : 'icon_3'"
      ></BaseImg>
    </div>
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
  orderStore.state.ifQuick = !orderStore.state.ifQuick;
  storageStore.setItem("ifQuick", orderStore.state.ifQuick);
  chartActionStore.toggleOrderBtn(orderStore.state.ifQuick);
};
</script>

<style lang="scss" scoped></style>
