<template>
  <div>
    <a-spin class="spin" :indicator="indicator" v-show="props.loading" />
    <div ref="chartContainer" v-show="!props.loading" style="height: 100vh;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, h } from 'vue';
import  * as library from 'public/charting_library';
import { LoadingOutlined } from '@ant-design/icons-vue';
import { useI18n } from 'vue-i18n';
import { okLight, okDark } from '@/assets/icons/index';

const { t, locale } = useI18n();

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
    default: false,
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
    default: '',
    type: String,
  },
  disabledFeatures: {
    default: ['use_localstorage_for_settings'],
    type: Array,
  },
  enabledFeatures: {
    default: ['move_logo_to_main_pane', 'chart_crosshair_menu'],
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
      initonReady();
    }
  }
);

onUnmounted(() => {
  if (chartWidget.value) {
    chartWidget.value.remove();
    chartWidget.value = null;
  }
});

const initonReady = () => {
  const widgetOptions: library.ChartingLibraryWidgetOptions = {
    symbol: props.symbol,
    interval: props.interval as library.ResolutionString,
    container: chartContainer.value,
    datafeed: props.datafeed as library.IBasicDataFeed ,
    timezone: props.timezone as library.Timezone,
    debug: props.debug,
    library_path: props.libraryPath,
    width: props.width,
    height: props.height,
    fullscreen: props.fullscreen,
    autosize: props.autosize,
    locale: (props.locale || locale.value) as library.LanguageCode,
    charts_storage_url: props.chartsStorageUrl,
    charts_storage_api_version: props.chartsStorageApiVersion as library.AvailableSaveloadVersions,
    client_id: props.clientId,
    theme: (window.localStorage.getItem('Theme') || props.theme) as library.ThemeName,
    enabled_features: props.enabledFeatures as library.ChartingLibraryFeatureset[],
    disabled_features: props.disabledFeatures as library.ChartingLibraryFeatureset[],
    compare_symbols: props.compareSymbols as library.CompareSymbol[],
    context_menu: {
      items_processor: (items, actionsFactory) => setProcessor(items, actionsFactory)
    }
  };
  chartWidget.value = new library.widget(widgetOptions);
  emit('createChart', chartWidget.value);
};

const changeTheme = (theme: string) => {
  if (chartWidget.value) {
    chartWidget.value.changeTheme(theme);
    window.localStorage.setItem('Theme', theme);
  }
};

const setProcessor: library.ContextMenuItemsProcessor = (items: readonly library.IActionVariant[], actionsFactory: library.ActionsFactory) => {
  const themeType = chartWidget.value.getTheme().toLowerCase();
  const themeIcon = themeType === 'dark' ? okDark : okLight;
  const darkTheme = actionsFactory.createAction({
    actionId: 'Chart.CustomActionId' as library.ActionId.ChartCustomActionId,
    label: t('chart.darkTheme'),
    iconChecked: themeIcon,
    checkable: true,
    checked:  themeType === 'dark',
    onExecute: () => changeTheme('dark')
  });
  const lightTheme = actionsFactory.createAction({
    actionId: 'Chart.CustomActionId' as library.ActionId.ChartCustomActionId,
    label: t('chart.lightTheme'),
    iconChecked: themeIcon,
    checkable: true,
    checked: themeType === 'light',
    onExecute: () => changeTheme('light')
  });
  const themes = actionsFactory.createAction({
    actionId: 'Chart.CustomActionId' as library.ActionId.ChartCustomActionId,
    label: t('chart.ThemeColor'),
    subItems: [darkTheme, lightTheme]
  });
  const result = items.length > 10 ? [themes, ...items] : items;
  return Promise.resolve(result);
} 
</script>

<style scoped>
.spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateY(-50%);
}
</style>
