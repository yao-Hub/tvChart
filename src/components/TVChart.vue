<template>
  <div>
    <div class="TVChartContainer" ref="chartContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import tvChartStore from '@/store/modules/tvChart'
import { widget } from '../../public/charting_library';

const chartContainer = ref();
const tvStore = tvChartStore()

// 字段含义见：https://zlq4863947.gitbook.io/tradingview/4-tu-biao-ding-zhi/widget-constructor
const props = defineProps({
  symbol: {
    default: 'AAPL',
    type: String,
  },
  interval: {
    default: '1',
    type: String,
  },
  datafeed: {
    default: () => { },
    type: Object
  },
  timezone: {
    default: 'Asia/Hong_Kong',
    type: String,
  },
  debug: {
    default: false,
    type: Boolean,
  },
  libraryPath: {
    default: '/charting_library/',
    type: String,
  },
  width: {
    default: 300,
    type: Number,
  },
  height: {
    default: 600,
    type: Number,
  },
  fullscreen: {
    default: true,
    type: Boolean,
  },
  autosize: {
    default: true,
    type: Boolean,
  },
  symbolSearchRequestDelay: {
    default: 100,
    type: Number,
  },
  toolbarBg: {
    default: '#f4f7f9',
    type: String,
  },
  studyCountLimit: {
    default: 5,
    type: Number,
  },
  locale: {
    default: 'zh',
    type: String,
  },
  disabledFeatures: {
    default: ["use_localstorage_for_settings"],
    type: Array,
  },
  chartsStorageUrl: {
    default: 'https://saveload.tradingview.com',
    type: String,
  },
  chartsStorageApiVersion: {
    default: '1.1',
    type: String,
  },
  clientId: {
    default: 'tradingview.com',
    type: String,
  },
  theme: {
    default: 'Light',
    type: String,
  },
  additionalSymbolInfoFields: {
    default: [
      { title: 'Ticker', propertyName: 'ticker' }
    ],
    type: Array,
  },
  compareSymbols: {
    default: [],
    type: Array,
  },
  timeframe: {
    default: '1',
    type: String,
  },
})
onMounted(async () => {
  const widgetOptions: any = {
    symbol: props.symbol,
    interval: props.interval,
    container: chartContainer.value,
    datafeed: props.datafeed,
    timezone: props.timezone,
    debug: props.debug,
    library_path: props.libraryPath,
    width: props.width,
    height: props.height,
    fullscreen: props.fullscreen,
    autosize: props.autosize,
    // symbol_search_request_delay: props.symbolSearchRequestDelay,
    // toolbar_bg: props.toolbarBg,
    // study_count_limit: props.studyCountLimit,
    locale: props.locale,
    disabled_features: props.disabledFeatures,
    charts_storage_url: props.chartsStorageUrl,
    charts_storage_api_version: props.chartsStorageApiVersion,
    client_id: props.clientId,
    theme: props.theme,
    // additional_symbol_info_fields: props.additionalSymbolInfoFields,
    compare_symbols: props.compareSymbols,
    // timeframe: props.timeframe,
  };
  tvStore.chartWidget = new widget(widgetOptions);
  // tvStore.chartWidget.onChartReady(() => {
    // 	chartWidget.value.headerReady().then(() => {
    // 		const button = chartWidget.value.createButton();

    // 		button.setAttribute('title', 'Click to show a notification popup');
    // 		button.classList.add('apply-common-tooltip');

    // 		button.addEventListener('click', () =>
    // 			chartWidget.value.showNoticeDialog({
    // 				title: 'Notification',
    // 				body: 'TradingView Charting Library API works correctly',
    // 				callback: () => {
    // 					// eslint-disable-next-line no-console
    // 					console.log('Noticed!');
    // 				},
    // 			})
    // 		);
    // 		button.innerHTML = 'Check API';
    // 	});
  // });
});

onUnmounted(() => {
  if (tvStore.chartWidget !== null) {
    tvStore.chartWidget.remove();
    tvStore.chartWidget = null;
  }
});
</script>

<style scoped>
/* .TVChartContainer {
  height: calc(100vh - 80px);
} */
</style>
