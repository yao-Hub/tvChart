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
import { reactive } from 'vue';
import { useI18n } from "vue-i18n";
import { IChartingLibraryWidget } from 'public/charting_library/charting_library';
import * as types from '@/types/chart/index'
import tvChartStore from '@/store/modules/tvChart'
import { allSymbols } from 'api/symbols/index'
import TVChart from '@/components/TVChart.vue';
import { datafeed } from './chartConfig'
import { chartReady } from './chartReady';

const { t, locale } = useI18n();

const tvStore = tvChartStore()

const states = reactive({
  symbol: 'XAU',
  compareSymbols: [],
  chartLoading: true
});

// widget初始化回调
const createChart = (widget: IChartingLibraryWidget) => {
  tvStore.chartWidget = widget;

  const chartInstance = new chartReady(widget, t);

  // 语言切换
  chartInstance.createLocaleBtn(locale.value, (value) => {
    states.chartLoading = true;
    locale.value = value;
    localStorage.setItem('language', value);
    setTimeout(() => {
      states.chartLoading = false;
    });
  });

  chartInstance.createOrderLine();
};

// 获取所有商品(品种)
const getSymbols = async () => {
  states.chartLoading = true;
  try {
    const res: any = await allSymbols({ server: 'upway-live' });
    tvStore.symbols = res.data;
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

<style scoped></style>
