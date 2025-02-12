<template>
  <div
    class="globalLoading"
    v-loading="true"
    v-if="chartInitStore.state.loading"
  ></div>

  <div class="chart" v-else>
    <WPHeader></WPHeader>
    <dragArea></dragArea>
    <FooterInfo></FooterInfo>
  </div>

  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
  <Feedback></Feedback>
  <DisclaimersZh v-if="locale === 'zh'"></DisclaimersZh>
  <DisclaimersEn v-if="locale === 'en'"></DisclaimersEn>

  <!-- 用来冒泡 响应图表的点击 -->
  <div class="bodyBox"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useChartInit } from "@/store/modules/chartInit";
import { useChartLine } from "@/store/modules/chartLine";
import { useLayout } from "@/store/modules/layout";
import { useNetwork } from "@/store/modules/network";
import { useOrder } from "@/store/modules/order";
import { useQuotes } from "@/store/modules/quotes";
import { useRate } from "@/store/modules/rate";
import { useSocket } from "@/store/modules/socket";
import { useSymbols } from "@/store/modules/symbols";
import { useTime } from "@/store/modules/time";
import { useUser } from "@/store/modules/user";
import { useRoot } from "@/store/store";

import {
  initDragResizeArea,
  resizeUpdate,
} from "utils/dragResize/drag_position";

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
const quotesStore = useQuotes();
const rootStore = useRoot();

const I18n = useI18n();
const { locale } = I18n;

// 情求token无效时 兼容electron的路由跳转
import { PageEnum } from "@/constants/pageEnum";
import eventBus from "utils/eventBus";
import { useRouter } from "vue-router";
const router = useRouter();
eventBus.on("go-login", () => {
  const login = userStore.account.login;
  const server = userStore.account.server;
  router.push({
    path: PageEnum.LOGIN_HOME,
    query: { login, server },
  });
});

const initRender = () => {
  timeStore.initTime(); // 初始化时间语言和时区
  chartLineStore.initSubLineAndQuote(); // 监听k线和报价
  socketStore.emitRate(); // 监听汇率
  rateStore.subRate(); // 监听汇率
  orderStore.getQuickTrans(); //  快捷交易
  orderStore.getOneTrans(); //一键交易
  // 3.拿到缓存信息才能确定历史页面布局
  layoutStore.initLayout(); // 布局显示隐藏
  chartInitStore.intLayoutType(); // 单图表 or 多图表
  chartInitStore.loadChartList(); // 加载图表
  // 记忆动作（没什么用(>^ω^<)喵）
  if (rootStore.cacheAction) {
    rootStore[rootStore.cacheAction]();
    rootStore.clearCacheAction();
  }
  chartInitStore.state.loading = false;
  setTimeout(() => {
    // 初始化各个模块位置
    initDragResizeArea();
  });
};

// 初始化 注意调用顺序
async function init() {
  try {
    chartInitStore.state.loading = true;
    // 1.先拿到 交易线路
    await networkStore.getLines();
    // 2.拿到节点才能去定位缓存信息，获取商品、节点、socket地址、订单情况
    userStore.initAccount();
    await networkStore.initNode();
    // 获取个人信息
    await userStore.getLoginInfo({ emitSocket: true });
    await Promise.all([
      symbolsStore.getAllSymbol(),
      quotesStore.getAllSymbolQuotes(),
      rateStore.getAllRates(),
      orderStore.initTableData(),
    ]);
  } catch (error) {
  } finally {
    initRender();
  }
}

// 浏览器页面变化布局随之变化
onMounted(() => {
  init();
  window.addEventListener("resize", resizeUpdate);
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeUpdate);
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
  chartInitStore.saveCharts();
  next();
});
</script>

<style scoped lang="scss">
@import "@/styles/_handle.scss";

.chart {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: auto;
}
.bodyBox {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 0;
  height: 0;
}
.globalLoading {
  @include background_color("background");
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99;
}
</style>
