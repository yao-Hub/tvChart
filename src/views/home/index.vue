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
import { onMounted } from "vue";

import { useSocket } from "@/store/modules/socket";
import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import { useUser } from "@/store/modules/user";
import { useOrder } from "@/store/modules/order";
import { useNetwork } from "@/store/modules/network";
import { useRoot } from "@/store/store";
import { useLayout } from "@/store/modules/layout";

import { initDragResizeArea } from "utils/dragResize/drag_position";

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
const layoutStore = useLayout();

// 获取所有商品(品种)
const getSymbols = async () => {
  const res: any = await allSymbols();
  chartSubStore.setSymbols(res.data);
};

// 初始化 注意调用顺序
async function init() {
  chartInitStore.loading = true;
  // 1.先拿到 交易线路
  await networkStore.getLines();
  // 2.拿到节点才能去定位缓存信息，获取品种、节点、socket地址
  userStore.initAccount();
  await networkStore.initNode();
  await getSymbols();
  socketStore.initSocket();
  // 3.拿到缓存信息才能确定历史页面布局
  layoutStore.initLayout();
  chartInitStore.intChartFlexDirection();
  chartInitStore.intLayoutType();
  // 4.确定了布局才去初始化各个模块位置
  initDragResizeArea();
  // 其余操作 都要基于拿到缓存信息才操作
  orderStore.getQuickTrans();
  chartInitStore.loadChartList();
  userStore.getLoginInfo({ emitSocket: true });
}
onMounted(async () => {
  try {
    await init();

    // 记忆动作（没什么用(>^ω^<)喵）
    const rootStore = useRoot();
    if (rootStore.cacheAction) {
      rootStore[rootStore.cacheAction]();
      rootStore.clearCacheAction();
    }
  } finally {
    chartInitStore.loading = false;
  }
});

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
