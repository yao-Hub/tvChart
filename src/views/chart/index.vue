<template>
  <div class="chart" v-if="!chartInitStore.loading">
    <div class="header">
      <div class="header__left">
        <MenuOutlined />
        <a-tooltip title="快捷键：F9">
          <a-button type="link" @click="orderStore.createOrder()">新订单</a-button>
        </a-tooltip>
        <LayoutController></LayoutController>
        <ThunderboltOutlined />
        <a-tooltip title="单图模式">
          <BorderOutlined @click="chartInitStore.chartLayoutType = 'single'"/>
        </a-tooltip>
        <a-tooltip title="多图模式">
          <AppstoreFilled @click="chartInitStore.chartLayoutType = 'multiple'"/>
        </a-tooltip>
      </div>
      <div class="header__right">
        <span>账号</span>
        <!-- <span>9999,9999</span> -->
        <CaretDownOutlined />
      </div>
    </div>
    <div class="dragArea">
      <div class="dragArea_item">
        <div class="demo" v-if="layoutStore.chartsVisable">
          <HolderOutlined class="handle" />
          <ChartList class="container_item" :loading="chartSubStore.chartsLoading"></ChartList>
        </div>
        <div class="demo" v-if="layoutStore.symbolsVisable">
          <HolderOutlined class="handle" />
          <SymbolList class="container_item"></SymbolList>
        </div>
      </div>
      <div class="dragArea_item">
        <div class="demo" v-if="layoutStore.orderAreaVisable">
          <HolderOutlined class="handle" />
          <OrderArea class="container_item"></OrderArea>
        </div>
      </div>
    </div>
    <FooterInfo class="footerInfo"></FooterInfo>
  </div>
  <Spin v-else></Spin>

  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
  <LoginDialog></LoginDialog>
</template>

<script setup lang="ts">
import { reactive, onMounted, nextTick } from 'vue';
import {
  MenuOutlined,
  ThunderboltOutlined,
  CaretDownOutlined,
  HolderOutlined,
  BorderOutlined,
  AppstoreFilled
} from '@ant-design/icons-vue';

import { useChartInit } from '@/store/modules/chartInit';
import { useChartSub } from '@/store/modules/chartSub';
import { useUser } from '@/store/modules/user';
import { useOrder } from '@/store/modules/order';
import { useLayout } from '@/store/modules/layout';

import { allSymbols } from 'api/symbols/index';
import { initDragResizeArea } from './dragResize';

import LayoutController from './components/LayoutController.vue';
import OrderDialog from '../orderDialog/index.vue';
import FloatMenu from './components/FloatMenu.vue';
import LoginDialog from '../loginDialog/index.vue';
import FooterInfo from '../footerInfo/index.vue';
import OrderArea from '../orderArea/index.vue';
import SymbolList from './components/SymbolList.vue';
import ChartList from './components/ChartList.vue';

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();
const userStore = useUser();
const orderStore = useOrder();
const layoutStore = useLayout();

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

  .header {
    padding: 0 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 50px;
    border-bottom: 1px solid;
    @include border_color('border');
    box-sizing: border-box;

    .header__left {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-evenly;
    }

    .header__right {
      display: flex;
      gap: 8px;
    }
  }

  .dragArea {
    height: calc(100vh - 30px - 50px);
    width: 100%;
    box-sizing: border-box;
    position: relative;

    .dragArea_item {
      width: 100%;
      box-sizing: border-box;
      position: relative;
      // background: red;
      
      .demo {
        box-sizing: border-box;
        position: absolute;
        user-select: none;
        overflow: auto;
        // border: 1px solid red;
        background: #525252;

        .container_item {
          height: 100%;
          width: 100%;
        }

        .handle {
          position: absolute;
          top: 10px;
          left: 5px;
          z-index: 2;
          cursor: grab;
        }
      }
    }
  }

  .footerInfo {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }
}
</style>
