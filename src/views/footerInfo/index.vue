<template>
  <div class="footerInfo scrollList">
    <div class="item">
      <el-text type="info">{{ $t("order.balance") }}：</el-text>
      <span>{{ loginInfo?.balance }} {{ loginInfo?.currency }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <el-text type="info">{{ $t("order.equity") }}：</el-text>
      <span>{{ userStore.equity }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <el-text type="info">{{ $t("order.Margin") }}：</el-text>
      <span>{{ userStore.margin }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <el-text type="info">{{ $t("order.marginFree") }}：</el-text>
      <span>{{ userStore.margin_free }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <el-text type="info">{{ $t("order.marginLevel") }}：</el-text>
      <span>{{ userStore.margin_level }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <el-text type="info">{{ $t("order.TotalProfit") }}：</el-text>
      <span :class="[+profitTotal > 0 ? 'buyWord' : 'sellWord']">{{
        profitTotal
      }}</span>
    </div>
    <div class="item_end">
      <Timezone></Timezone>
      <el-divider direction="vertical" />
      <Delay></Delay>
    </div>
  </div>
</template>

<script setup lang="ts">
import Decimal from "decimal.js";
import { computed } from "vue";

import { useOrder } from "@/store/modules/order";
import { useUser } from "@/store/modules/user";

import Delay from "./components/Delay.vue";
import Timezone from "./components/Timezone.vue";

const userStore = useUser();
const orderStore = useOrder();

const loginInfo = computed(() => userStore.state.loginInfo);

const profitTotal = computed(() => {
  const profitList = orderStore.state.orderData.marketOrder.map(
    (item) => new Decimal(+item.profit)
  );
  const result = profitList.reduce((pre, next) => {
    return pre.plus(next);
  }, new Decimal(0));
  return result.toNumber().toFixed(2);
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.footerInfo {
  width: 100vw;
  box-sizing: border-box;
  height: 40px;
  @include background_color("background");
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  overflow-x: auto;
  display: flex;
  align-items: center;
  padding: 0 16px;

  .item {
    display: flex;
    height: 100%;
    justify-content: center;
    align-items: center;
    padding: 0 8px;
    flex-shrink: 0;
  }
  .item_end {
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
  }
}
</style>
