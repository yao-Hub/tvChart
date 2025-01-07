<template>
  <div class="chart" v-loading.fullscreen.lock="chartInitStore.state.loading">
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
import { nextTick, onMounted, watch } from "vue";

import { useChartInit } from "@/store/modules/chartInit";
import { useChartLine } from "@/store/modules/chartLine";
import { useLayout } from "@/store/modules/layout";
import { useNetwork } from "@/store/modules/network";
import { useOrder } from "@/store/modules/order";
import { useRate } from "@/store/modules/rate";
import { useSocket } from "@/store/modules/socket";
import { useSymbols } from "@/store/modules/symbols";
import { useUser } from "@/store/modules/user";
import { useRoot } from "@/store/store";

import {
  initDragResizeArea,
  resizeUpdate,
} from "utils/dragResize/drag_position";

import { useTime } from "@/store/modules/time";
import dragArea from "../dragArea/index.vue";
import FooterInfo from "../footerInfo/index.vue";
import WPHeader from "../header/index.vue";
import OrderDialog from "../orderDialog/index.vue";
import FloatMenu from "./components/FloatMenu.vue";

const chartInitStore = useChartInit();
const userStore = useUser();
const orderStore = useOrder();
const networkStore = useNetwork();
const socketStore = useSocket();
const layoutStore = useLayout();
const chartLineStore = useChartLine();
const symbolsStore = useSymbols();
const timeStore = useTime();
const rateStore = useRate();
const rootStore = useRoot();

// 初始化 注意调用顺序
async function init() {
  try {
    chartInitStore.state.loading = true;

    // 1.先拿到 交易线路
    await networkStore.getLines();
    // 2.拿到节点才能去定位缓存信息，获取品种、节点、socket地址、订单情况
    userStore.initAccount();
    await networkStore.initNode();
    await Promise.all([
      symbolsStore.getAllSymbol(),
      symbolsStore.getAllSymbolQuotes(),
      rateStore.getAllRates(),
      orderStore.initTableData(),
      userStore.getLoginInfo({ emitSocket: true }), // 获取个人信息
    ]);
  } catch (error) {
    chartInitStore.state.loading = false;
  } finally {
    timeStore.initTime(); // 初始化时间语言和时区

    socketStore.initSocket(); // 初始化socket
    chartLineStore.initSubLineAndQuote(); // 监听k线和报价
    socketStore.emitRate(); // 监听汇率
    rateStore.subRate(); // 监听汇率
    orderStore.getQuickTrans();
    // 3.拿到缓存信息才能确定历史页面布局
    layoutStore.initLayout(); // 布局显示隐藏
    chartInitStore.intLayoutType(); // 单图表 or 多图表
    await nextTick();
    // 4.确定了布局才去初始化各个模块位置
    initDragResizeArea();
    chartInitStore.loadChartList(); // 加载图表
    // 记忆动作（没什么用(>^ω^<)喵）
    if (rootStore.cacheAction) {
      rootStore[rootStore.cacheAction]();
      rootStore.clearCacheAction();
    }
    chartInitStore.state.loading = false;
  }
}

// 浏览器页面变化布局随之变化
onMounted(() => {
  init();
  window.addEventListener("resize", () => {
    resizeUpdate();
  });
});

// 全局刷新重置store 热更新
watch(
  () => chartInitStore.state.globalRefresh,
  async (val) => {
    if (val) {
      await rootStore.resetAllStore();
      init();
    }
  }
);

// 离开页面保存图表操作
// 撤销监听 resize
import { onBeforeRouteLeave } from "vue-router";
onBeforeRouteLeave((to, from, next) => {
  window.removeEventListener("resize", () => {
    resizeUpdate();
  });
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
