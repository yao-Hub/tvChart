<template>
  <div class="chart" v-loading.fullscreen.lock="chartInitStore.loading">
    <WPHeader></WPHeader>
    <dragArea></dragArea>
    <FooterInfo></FooterInfo>
  </div>

  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
  <Disclaimers></Disclaimers>
</template>

<script setup lang="ts">
import { reactive, onMounted } from "vue";

import { useSocket } from "@/store/modules/socket";
import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import { useUser } from "@/store/modules/user";
import { useOrder } from "@/store/modules/order";
import { useNetwork } from "@/store/modules/network";
import { useRoot } from "@/store/store";

import { allSymbols } from "api/symbols/index";

import WPHeader from "../header/index.vue";
import dragArea from "../dragArea/index.vue";
import OrderDialog from "../orderDialog/index.vue";
import FloatMenu from "./components/FloatMenu.vue";
import FooterInfo from "../footerInfo/index.vue";

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();
const userStore = useUser();
const orderStore = useOrder();
const networkStore = useNetwork();
const socketStore = useSocket();

const state = reactive({
  symbol: "XAU",
});

// 获取所有商品(品种)
const getSymbols = async () => {
  const res: any = await allSymbols();
  chartSubStore.setSymbols(res.data);
  state.symbol = res.data[0]?.symbol;
};

async function init() {
  chartInitStore.loading = true;
  chartInitStore.intChartFlexDirection();
  chartInitStore.intLayoutType();
  orderStore.getQuickTrans();
  userStore.initUser();
  await networkStore.getLines();
  await networkStore.initNode();
  socketStore.initSocket();
  getSymbols();
  userStore.getLoginInfo({ emitSocket: true });
}
onMounted(async () => {
  try {
    await init();

    // 记忆动作
    const rootStore = useRoot();
    if (rootStore.cacheAction) {
      rootStore[rootStore.cacheAction]();
      rootStore.clearCacheAction();
    }
  } finally {
    chartInitStore.loading = false;
  }
});
</script>

<style scoped lang="scss">
.chart {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: auto;
}
</style>
