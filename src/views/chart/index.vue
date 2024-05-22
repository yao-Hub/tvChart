<template>
  <div>
    <TVChart
      :datafeed="datafeed()"
      :symbol="states.symbol"
      :compareSymbols="states.compareSymbols"
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
// import * as types from  '@/types/chart/index'

const tvStore = tvChartStore()

const states = reactive({
  symbol: 'XAG',
  compareSymbols: []
});

const getSymbols = async () => {
  const res:any = await allSymbols({ server: 'upway-live' })
  tvStore.symbols = res.data;
  states.symbol = res.data[0].symbol;
  // states.compareSymbols = res.data.map((item: types.SessionSymbolInfo) => {
  //   return {
  //     symbol: item.symbol,
  //     title: item.symbol
  //   }
  // });
}
getSymbols();
</script>

<style scoped>
</style>
