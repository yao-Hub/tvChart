<template>
  <div v-show="!props.loading" ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import * as library from "public/charting_library";
import { useI18n } from "vue-i18n";
import { useChartInit } from "@/store/modules/chartInit";
import { useOrder } from "@/store/modules/order";
import { useChartSub } from "@/store/modules/chartSub";

const chartInitStore = useChartInit();
const orderStore = useOrder();
const chartSubStore = useChartSub();

const { locale } = useI18n();

// 字段含义见：https://zlq4863947.gitbook.io/tradingview/4-tu-biao-ding-zhi/widget-constructor
const props = defineProps({
  chartId: {
    default: "",
    type: String,
  },
  mainChart: {
    default: false,
    type: Boolean,
  },
  loading: {
    default: false,
    type: Boolean,
  },
  symbol: {
    default: "XAU",
    type: String,
  },
  interval: {
    default: "1",
    type: String,
  },
  datafeed: {
    default: () => {},
    type: Object,
  },
  timezone: {
    default: "Asia/Hong_Kong",
    type: String,
  },
  debug: {
    default: false,
    type: Boolean,
  },
  libraryPath: {
    default: "/charting_library/",
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
    default: "#f4f7f9",
    type: String,
  },
  studyCountLimit: {
    default: 5,
    type: Number,
  },
  locale: {
    default: "",
    type: String,
  },
  disabledFeatures: {
    default: [],
    type: Array,
  },
  enabledFeatures: {
    default: [],
    type: Array,
  },
  chartsStorageUrl: {
    default: "https://saveload.tradingview.com",
    type: String,
  },
  chartsStorageApiVersion: {
    default: "1.1",
    type: String,
  },
  clientId: {
    default: "tradingview.com",
    type: String,
  },
  theme: {
    default: "light",
    type: String,
  },
  additionalSymbolInfoFields: {
    default: [{ title: "Ticker", propertyName: "ticker" }],
    type: Array,
  },
  compareSymbols: {
    default: [],
    type: Array,
  },
  timeframe: {
    default: "1",
    type: String,
  },
  contextMenu: {
    default: () => {},
    type: Object,
  },
});

const chartContainer = ref();
const emit = defineEmits(["initChart"]);

onMounted(() => {
  initonReady();
});

const initonReady = () => {
  if (!props.chartId) {
    return new Error("chartId is no defined");
  }
  const widgetOptions: library.ChartingLibraryWidgetOptions = {
    symbol: props.symbol,
    interval: props.interval as library.ResolutionString,
    container: chartContainer.value,
    datafeed: props.datafeed as library.IBasicDataFeed,
    timezone: props.timezone as library.Timezone,
    debug: props.debug,
    library_path: props.libraryPath,
    width: props.width,
    height: props.height,
    fullscreen: props.fullscreen,
    autosize: props.autosize,
    locale: (props.locale || locale.value) as library.LanguageCode,
    charts_storage_url: props.chartsStorageUrl,
    charts_storage_api_version:
      props.chartsStorageApiVersion as library.AvailableSaveloadVersions,
    client_id: props.clientId,
    theme: (window.localStorage.getItem("systemTheme") || props.theme) as library.ThemeName,
    enabled_features:
      props.enabledFeatures as library.ChartingLibraryFeatureset[],
    disabled_features:
      props.disabledFeatures as library.ChartingLibraryFeatureset[],
    compare_symbols: props.compareSymbols as library.CompareSymbol[],
    context_menu: props.contextMenu,
  };
  const widget = new library.widget(widgetOptions);

  if (props.mainChart) {
    chartInitStore.mainId = props.chartId;
  }
  widget.onChartReady(() => {
    widget.headerReady().then(() => {

      chartInitStore.setChartWidget(props.chartId, widget);

      const chartSymbol = chartInitStore.getChartWidgetListSymbol(props.chartId);
      if (chartSymbol) {
        chartInitStore.syncSetChart();
      } else {
        chartInitStore.setChartWidgetListSymbolInterval({
          id: props.chartId,
          symbol: props.symbol,
          interval: props.interval as library.ResolutionString,
        });
      }

      // 监听品种变化
      widget
        .activeChart()
        .onSymbolChanged()
        // @ts-ignore
        .subscribe(null, (e) => {
          orderStore.currentSymbol = e.name;
          chartInitStore.setChartWidgetListSymbolInterval({ symbol: e.name, id: props.chartId });
        });

      widget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (interval) => {
          chartInitStore.setChartWidgetListSymbolInterval({ interval, id: props.chartId });
        })

      chartSubStore.subscribeKeydown(widget);

      emit("initChart", { id: props.chartId });
    });
  });
};
</script>

<style scoped lang="scss"></style>
