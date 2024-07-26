<template>
  <div class="chart" v-if="!chartInitStore.loading">
    <WPHeader></WPHeader>
    <dragArea></dragArea>
    <FooterInfo></FooterInfo>
  </div>
  <Spin v-else></Spin>

  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
  <LoginDialog></LoginDialog>
</template>

<script setup lang="ts">
import { reactive, onMounted, nextTick } from 'vue';

import { useChartInit } from '@/store/modules/chartInit';
import { useChartSub } from '@/store/modules/chartSub';
import { useUser } from '@/store/modules/user';

import { allSymbols } from 'api/symbols/index';
import { initDragResizeArea } from 'utils/dragResize/index';

import WPHeader from '../header/index.vue';
import dragArea from '../dragArea/index.vue';
import OrderDialog from '../orderDialog/index.vue';
import FloatMenu from './components/FloatMenu.vue';
import LoginDialog from '../loginDialog/index.vue';
import FooterInfo from '../footerInfo/index.vue';


const chartInitStore = useChartInit();
const chartSubStore = useChartSub();
const userStore = useUser();

const state = reactive({
  symbol: 'XAU',
});

// 获取所有商品(品种)
const getSymbols = async () => {
  chartInitStore.loading = true;
  try {
    const res: any = await allSymbols();
    chartSubStore.setSymbols(res.data);
    state.symbol = res.data[0].symbol;
    chartInitStore.loading = false;
  } catch {
    chartInitStore.loading = false;
  }
};

onMounted(async () => {
  await getSymbols();
  await nextTick();
  userStore.initUser();
  initDragResizeArea();
});
</script>

<style scoped lang="scss">
@import '@/assets/styles/_handle.scss';
.chart {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: auto;
}
</style>
