<template>
  <div class="chart" v-loading.fullscreen.lock="chartInitStore.loading">
    <WPHeader></WPHeader>
    <dragArea></dragArea>
    <FooterInfo></FooterInfo>
  </div>

  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
  <Feedback></Feedback>
  <Disclaimers></Disclaimers>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick } from "vue";

import { useSocket } from "@/store/modules/socket";
import { useChartInit } from "@/store/modules/chartInit";
import { useUser } from "@/store/modules/user";
import { useOrder } from "@/store/modules/order";
import { useNetwork } from "@/store/modules/network";
import { useRoot } from "@/store/store";
import { useLayout } from "@/store/modules/layout";
import { useSize } from "@/store/modules/size";
import { useChartLine } from "@/store/modules/chartLine";
import { useSymbols } from "@/store/modules/symbols";

import { initDragResizeArea } from "utils/dragResize/drag_position";

import WPHeader from "../header/index.vue";
import dragArea from "../dragArea/index.vue";
import OrderDialog from "../orderDialog/index.vue";
import FloatMenu from "./components/FloatMenu.vue";
import FooterInfo from "../footerInfo/index.vue";

const chartInitStore = useChartInit();
const userStore = useUser();
const orderStore = useOrder();
const networkStore = useNetwork();
const socketStore = useSocket();
const layoutStore = useLayout();
const sizeStore = useSize();
const chartLineStore = useChartLine();
const symbolsStore = useSymbols();

// 初始化 注意调用顺序
async function init() {
  try {
    chartInitStore.loading = true;
    // 1.先拿到 交易线路
    await networkStore.getLines();
    // 2.拿到节点才能去定位缓存信息，获取品种、节点、socket地址
    userStore.initAccount();
    await networkStore.initNode();
    await symbolsStore.getAllSymbol();
  } catch (error) {
    chartInitStore.loading = false;
  } finally {
    socketStore.initSocket();
    chartLineStore.initSubLineAndQuote();
    userStore.getLoginInfo({ emitSocket: true });
    sizeStore.initSize();
    orderStore.getQuickTrans();
    await nextTick();
    // 3.拿到缓存信息才能确定历史页面布局
    layoutStore.initLayout();
    chartInitStore.intChartFlexDirection();
    chartInitStore.intLayoutType();
    // 4.确定了布局才去初始化各个模块位置
    initDragResizeArea();
    chartInitStore.loadChartList();
    // 记忆动作（没什么用(>^ω^<)喵）
    const rootStore = useRoot();
    if (rootStore.cacheAction) {
      rootStore[rootStore.cacheAction]();
      rootStore.clearCacheAction();
    }
    chartInitStore.loading = false;
    await orderStore.initTableData();
  }
}
onMounted(() => {
  init();
});

watch(
  () => chartInitStore.globalRefresh,
  (val) => {
    val && init();
  }
);

import { onBeforeRouteLeave } from "vue-router";
onBeforeRouteLeave((to, from, next) => {
  chartInitStore.saveCharts();
  next();
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
