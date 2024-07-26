<template>
  <div class="chart" v-if="!chartInitStore.loading">
    <WPHeader></WPHeader>
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
  HolderOutlined,
} from '@ant-design/icons-vue';

import { useChartInit } from '@/store/modules/chartInit';
import { useChartSub } from '@/store/modules/chartSub';
import { useUser } from '@/store/modules/user';
import { useLayout } from '@/store/modules/layout';

import { allSymbols } from 'api/symbols/index';
import { initDragResizeArea } from 'utils/dragResize/index';

import WPHeader from '../header/index.vue'
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
