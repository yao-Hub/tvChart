<template>
  <div class="footerInfo">
    <div class="item">
      <span>{{ $t("order.balance") }}：</span>
      <span>{{ loginInfo?.balance }} {{ loginInfo?.currency }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <span>{{ $t("order.equity") }}：</span>
      <span>{{ userStore.equity }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <span>{{ $t("order.Margin") }}：</span>
      <span>{{ userStore.margin }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <span>{{ $t("order.marginFree") }}：</span>
      <span>{{ userStore.margin_free }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <span>{{ $t("order.marginLevel") }}：</span>
      <span>{{ userStore.margin_level }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <span>{{ $t("order.TotalProfit") }}：</span>
      <span :class="[+profit > 0 ? 'redWord' : 'greenWord']">{{ profit }}</span>
    </div>
    <div class="item_end">
      <Timezone></Timezone>
      <el-divider direction="vertical" />
      <Delay></Delay>
    </div>
  </div>
</template>

<script setup lang="ts">
import { round } from "utils/common/index";
import { computed } from "vue";

import { useOrder } from "@/store/modules/order";
import { useUser } from "@/store/modules/user";

import Delay from "./components/Delay.vue";
import Timezone from "./components/Timezone.vue";

const userStore = useUser();
const orderStore = useOrder();

const loginInfo = computed(() => userStore.loginInfo);

// 总盈亏
const profit = computed(() => {
  try {
    if (!loginInfo.value) {
      return "-";
    }
    const currentPosition = orderStore.orderData.marketOrder;
    const sum = currentPosition?.reduce((accumulator, currentValue) => {
      return accumulator + Number(currentValue.profit);
    }, 0);
    return round(sum || 0, 2);
  } catch (error) {
    return "-";
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.footerInfo {
  width: 100vw;
  box-sizing: border-box;
  height: 30px;
  @include background_color("background-component");
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
    & span:first-child {
      @include font_color("word-gray");
    }
  }
  .item_end {
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
