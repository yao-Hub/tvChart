<template>
  <div class="chart">
    <WPHeader></WPHeader>
    <dragArea></dragArea>
    <FooterInfo></FooterInfo>
  </div>
  <div v-if="chartInitStore.loading" class="loading">
    <Spin></Spin>
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
import { initDragResizeArea } from "utils/dragResize/index";

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
  orderStore.getQuickTrans();
  userStore.initUser();
  initDragResizeArea();
  await networkStore.getLines();
  await networkStore.initNode();
  socketStore.initSocket();
  getSymbols();
  userStore.getLoginInfo(true);
};
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
@import "@/assets/styles/_handle.scss";
.chart {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: auto;
}
.loading {
  height: 100vh;
  width: 100vw;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
  @include background_color("background");
}
</style>
