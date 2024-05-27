<template>
  <div>
    <a-spin class="spin" :indicator="indicator" v-show="props.loading" />
    <div ref="chartContainer" v-show="!props.loading"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue';
import { widget } from 'public/charting_library';
import { LoadingOutlined } from '@ant-design/icons-vue';
import { h } from 'vue';

const indicator = h(LoadingOutlined, {
  style: {
    fontSize: '50px',
  },
  spin: true,
});

// 字段含义见：https://zlq4863947.gitbook.io/tradingview/4-tu-biao-ding-zhi/widget-constructor
const props = defineProps({
  loading: {
    default: false,
    type: Boolean
  },
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
    default: ['use_localstorage_for_settings'],
    type: Array,
  },
  enabledFeatures: {
    default: [],
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
    default: 'dark',
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

const chartContainer = ref();
const chartWidget = ref();
const emit = defineEmits(['createChart']);
watch(
  () => props.loading,
  newVal => {
    if (!newVal) {
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
        locale: props.locale,
        charts_storage_url: props.chartsStorageUrl,
        charts_storage_api_version: props.chartsStorageApiVersion,
        client_id: props.clientId,
        theme: props.theme,
        enabled_features: props.enabledFeatures,
        disabled_features: props.disabledFeatures,
        compare_symbols: props.compareSymbols,
      };
      chartWidget.value = new widget(widgetOptions);
      emit('createChart', chartWidget.value);
    }
  })

onUnmounted(() => {
  if (chartWidget.value) {
    chartWidget.value.remove();
    chartWidget.value = null;
  }
});
</script>

<style scoped>
.spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateY(-50%);
}
</style>
