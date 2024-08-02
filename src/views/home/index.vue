<template>
  <div class="chart" v-show="!chartInitStore.loading && !chartInitStore.ifInitError">
    <WPHeader></WPHeader>
    <dragArea></dragArea>
    <FooterInfo></FooterInfo>
  </div>
  <Spin v-show="chartInitStore.loading"></Spin>

  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
</template>

<script setup lang="ts">
import { reactive, onMounted, nextTick } from "vue";
import { Modal } from "ant-design-vue";

import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import { useUser } from "@/store/modules/user";

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
    await getSymbols();
    await nextTick();
    userStore.initUser();
    initDragResizeArea();
    chartInitStore.ifInitError = false;
  } catch (error) {
    chartInitStore.ifInitError = true;
    Modal.error({
      title: "出错了",
      content: "请刷新页面重试",
      onOk() {
        window.location.reload();
      },
    });
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
