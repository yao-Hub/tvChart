<template>
  <div class="footerInfo">
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
import { computed } from "vue";

import { useOrder } from "@/store/modules/order";
import { useUser } from "@/store/modules/user";

import { round } from "@/utils/common";
import Delay from "./components/Delay.vue";
import Timezone from "./components/Timezone.vue";

const userStore = useUser();
const orderStore = useOrder();

const loginInfo = computed(() => userStore.loginInfo);

const profitTotal = computed<string>(() => {
  const profitList = orderStore.orderData.marketOrder.map(
    (item) => +item.profit
  );
  const result = profitList.reduce((pre, next) => pre + next, 0);
  return round(result, 2);
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.footerInfo {
  width: 100vw;
  box-sizing: border-box;
  height: 30px;
  @include background_color("backgroun");
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
  display: flex;
  align-items: center;
  padding: 0 16px;

  .item {
    min-width: 100px;
    overflow: auto;
    display: flex;
    height: 100%;
    justify-content: center;
    align-items: center;
    padding: 0 8px;
  }
  .item_end {
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
