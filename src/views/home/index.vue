<template>
  <div
    class="chart"
    v-show="!chartInitStore.loading && !chartInitStore.ifInitError"
  >
    <WPHeader></WPHeader>
    <dragArea></dragArea>
    <FooterInfo></FooterInfo>
  </div>
  <Spin v-show="chartInitStore.loading"></Spin>

  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
  <Disclaimers></Disclaimers>
</template>

<script setup lang="ts">
import { reactive, onMounted, nextTick } from "vue";
// import { Modal } from "ant-design-vue";
import { useRouter } from "vue-router";

import { useSocket } from "@/store/modules/socket";
import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import { useUser } from "@/store/modules/user";
import { useOrder } from "@/store/modules/order";
// import { useNetwork } from "@/store/modules/network";
// import { useRoot } from "@/store/store";

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
// const networkStore = useNetwork();
const socketStore = useSocket();

const state = reactive({
  symbol: "XAU",
});

// 获取所有商品(品种)
const getSymbols = async () => {
  const res: any = await allSymbols();
  chartSubStore.setSymbols(res.data);
  state.symbol = res.data[0].symbol;
  chartInitStore.loading = false;
};

onMounted(async () => {
  try {
    chartInitStore.loading = true;
    chartInitStore.ifInitError = false;
    // networkStore.initNode();
    socketStore.initSocket();
    orderStore.getQuickTrans();
    await nextTick();
    await userStore.initUser();
    await getSymbols();

    // 初始化拖拽
    initDragResizeArea();

    // 记忆动作
    // const rootStore = useRoot();
    // if (rootStore.cacheAction) {
    //   rootStore[rootStore.cacheAction]();
    //   rootStore.clearCacheAction();
    // }
  } catch (error) {
    chartInitStore.ifInitError = true;
    const router = useRouter();
    router.push({ name: 'login' });
    // Modal.error({
    //   title: "出错了",
    //   content: "请刷新页面重试",
    //   onOk() {
    //     window.location.reload();
    //   },
    // });
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
</style>
