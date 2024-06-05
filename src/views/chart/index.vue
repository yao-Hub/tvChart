<template>
  <div>
    <TVChart
      :datafeed="datafeed()"
      :symbol="states.symbol"
      :loading="states.chartLoading"
      :compareSymbols="states.compareSymbols"
      @createChart="createChart"
      >
    </TVChart>
    <FloatMenu></FloatMenu>
    <OrderDialog></OrderDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { IChartingLibraryWidget } from 'public/charting_library/charting_library';
import * as types from '@/types/chart/index';
import chartSubStore from '@/store/modules/chartSub'
import chartActionStore from '@/store/modules/chartAction'
import { allSymbols } from 'api/symbols/index'
import TVChart from '@/components/TVChart.vue';
import OrderDialog from './components/OrderDialog.vue';
import FloatMenu from './components/FloatMenu.vue';
import { datafeed } from './chartConfig';

const chartSub = chartSubStore();
const chartAction = chartActionStore();

const states = reactive({
  symbol: 'XAU',
  compareSymbols: [],
  chartLoading: true
});

// widget初始化回调
const createChart = (widget: IChartingLibraryWidget) => {
  chartSub.chartWidget = widget;
  chartAction.createLocaleBtn();
  chartAction.createOrderLine();
  chartAction.createAvatar();

  chartSub.subscribePlusBtn();
  chartSub.subscribeMouseDown();
};

// 获取所有商品(品种)
const getSymbols = async () => {
  states.chartLoading = true;
  try {
    const res: any = await allSymbols({ server: 'upway-live' });
    chartSub.symbols = res.data;
    states.symbol = res.data[0].symbol;
    states.compareSymbols = res.data.map((item: types.SessionSymbolInfo) => {
      return {
        symbol: item.symbol,
        title: item.symbol
      }
    });
    states.chartLoading = false;
  } catch (error) {
    console.log(error)
    states.chartLoading = false;
  }
}
getSymbols();
</script>

<style>
</style>
