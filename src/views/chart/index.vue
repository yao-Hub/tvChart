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
  </div>
</template>

<script setup lang="ts">
import TVChart from '@/components/TVChart.vue';
import { reactive } from 'vue';
import { datafeed } from './config'
import { allSymbols } from 'api/symbols/index'
import tvChartStore from '@/store/modules/tvChart'
import * as types from  '@/types/chart/index'

const tvStore = tvChartStore()

const createChart = (chart: any) => {
  tvStore.chartWidget = chart;
};

const states = reactive({
  symbol: '',
  compareSymbols: [],
  chartLoading: true
});

const getSymbols = async () => {
  states.chartLoading = true;
  allSymbols({ server: 'upway-live' }).then((res: any) => {
    tvStore.symbols = res.data;
    states.symbol = res.data[0].symbol;
    states.compareSymbols = res.data.map((item: types.SessionSymbolInfo) => {
      return {
        symbol: item.symbol,
        title: item.symbol
      }
    });
    states.chartLoading = false;
  }).catch(() => {
    states.chartLoading = false;
  });
}
getSymbols();
</script>

<style scoped>
</style>
