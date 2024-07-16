<template>
  <div class="chart" v-if="!chartInitStore.loading">
    <div class="header">
      <div class="header__left">
        <MenuOutlined />
        <a-button type="link" @click="orderStore.createOrder()">创建订单</a-button>
        <LayoutController></LayoutController>
        <ThunderboltOutlined />
      </div>
      <div class="header__right">
        <span>账号</span>
        <!-- <span>9999,9999</span> -->
        <CaretDownOutlined />
      </div>
    </div>
    <div class="dragArea">
      <div class="dragArea_item dragArea_item_top">
        <div class="demo" v-if="layoutStore.chartsVisable">
          <HolderOutlined class="handle" />
          <ChartList class="container_item" name="one" :loading="chartSubStore.chartLoading"></ChartList>
        </div>
        <div class="demo" v-if="layoutStore.symbolsVisable">
          <HolderOutlined class="handle" />
          <SymbolList class="container_item" name="two"></SymbolList>
        </div>
      </div>
      <div class="dragArea_item dragArea_item_down">
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
  HolderOutlined
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
  } catch (error) {
    console.log(error);
    chartInitStore.loading = false;
  }
};
getSymbols();

onMounted(() => {
  userStore.initUser();
});

onMounted(async () => {
  await nextTick();
  setTimeout(() => {
    initDragResizeArea();
  }, 500);
});
</script>

<style scoped lang="scss">
@import '@/assets/styles/_handle.scss';

.divider {
  background-color: #434651;
}

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
    border-bottom: 1px solid #434651;
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
      
      .demo {
        box-sizing: border-box;
        position: absolute;
        user-select: none;
        overflow: auto;
        // border: 1px solid red;

        .container_item {
          height: 100%;
          width: 100%;
        }

        .handle {
          position: absolute;
          top: 10px;
          left: 5px;
          z-index: 2;
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
