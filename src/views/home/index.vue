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
import { onBeforeUnmount, onMounted, onUnmounted, ref, watch } from "vue";
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

/** 初始化 注意调用顺序
 * 1.先拿到 交易线路
 * 2.拿到缓存账户信息
 * 3.拿到网络节点
 * 4.获取个人信息，在这一步判断是否token过期
 * 5.拿其他基于网络节点的数据
 * 6.开始渲染页面
 *    a.拿缓存的布局信息
 *    b.渲染页面布局
 *    c.等待图表渲染完毕之后再去加载socket(chartInit.ts，优化初始化加载)
 * */
async function init() {
  try {
    chartInitStore.state.loading = true;
    await networkStore.getLines(); //  交易线路
    userStore.initAccount(); // 账户信息
    await networkStore.initNode(); // 网络节点
    await userStore.getLoginInfo({ emitSocket: true }); // 个人信息
    await Promise.all([
      symbolsStore.getAllSymbol(),
      quotesStore.getAllSymbolQuotes(),
      rateStore.getAllRates(),
      orderStore.initTableData(),
    ]);
    userStore.refreshToken(); // 倒计时刷新token
  } catch (error) {
  } finally {
    initRender(); // 渲染页面
  }
}

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

// 当浏览器超出内存时，切换标签页会自动断开socket连接
// 断开连接重新热更新页面
const socketState = ref("");
eventBus.on("socket-disconnect", () => {
  socketState.value = "disconnect";
});
eventBus.on("socket-connect", () => {
  socketState.value = "connect";
});
eventBus.on("socket-error", () => {
  socketState.value = "error";
});
const handleVisibilityChange = () => {
  if (
    document.visibilityState === "visible" &&
    socketState.value === "disconnect"
  ) {
    chartInitStore.systemRefresh();
  }
};

// 浏览器页面变化布局随之变化
onMounted(() => {
  init();
  window.addEventListener("resize", resizeUpdate);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

// 离开页面保存图表操作
// 撤销监听 resize
onBeforeUnmount(() => {
  chartInitStore.saveCharts();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("resize", resizeUpdate);
});

// 重置vuex的state
onUnmounted(() => {
  rootStore.resetAllStore();
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
