<template>
  <div v-show="!props.loading" ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { timezoneOptions } from "@/constants/timezone";
import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import * as library from "public/charting_library";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();

const { locale } = useI18n();

// 字段含义见：https://zlq4863947.gitbook.io/tradingview/4-tu-biao-ding-zhi/widget-constructor
const props = defineProps({
  chartId: {
    default: "",
    type: String,
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
    default: "Asia/Shanghai",
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
    default: "",
    type: String,
  },
  chartsStorageApiVersion: {
    default: "1.1",
    type: String,
  },
  client_id: {
    default: "client_id",
    type: String,
  },
  user_id: {
    default: "user_id",
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
  try {
    initonReady();
  } catch (error) {
    console.log(error);
  }
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
    client_id: props.client_id,
    user_id: props.user_id,
    theme: props.theme as library.ThemeName,
    enabled_features:
      props.enabledFeatures as library.ChartingLibraryFeatureset[],
    disabled_features:
      props.disabledFeatures as library.ChartingLibraryFeatureset[],
    compare_symbols: props.compareSymbols as library.CompareSymbol[],
    context_menu: props.contextMenu,
    custom_css_url: "/charting_library/static/tvcss.css",
    custom_timezones: timezoneOptions as library.CustomAliasedTimezone[],
  };

  // 读取缓存数据
  const savedData = chartInitStore.getChartSavedData(props.chartId);
  if (savedData) {
    widgetOptions.saved_data = savedData;
  }

  // 实例化
  const widget: library.IChartingLibraryWidget = new library.widget(
    widgetOptions
  );

  chartInitStore.setChartLoadingEndType(props.chartId);

  widget?.onChartReady(() => {
    widget?.headerReady().then(() => {
      chartInitStore.createChartWidget(props.chartId, widget);

      // 快捷键监听
      chartSubStore.subscribeKeydown(widget);

      // 监听品种变化
      widget
        .activeChart()
        .onSymbolChanged()
        // @ts-ignore
        .subscribe(null, (e) => {
          chartInitStore.state.activeChartId = props.chartId;
        });

      // 监听周期变化
      widget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (interval) => {
          chartInitStore.state.activeChartId = props.chartId;
        });

      // 监听鼠标按下
      widget.subscribe("mouse_down", () => {
        chartInitStore.state.activeChartId = props.chartId;
      });

      // 增加策略
      if (!savedData) {
        widget.activeChart().createStudy("MACD");
        widget.activeChart().createStudy("Moving Average Double");
      }

      // 图表主题(正常是不用重新再这里改变的，但是如果自己更改了缓存，则需要这个)
      widget.changeTheme(props.theme as library.ThemeName);

      setTimeout(() => {
        emit("initChart", { id: props.chartId, widget });
      }, 200);
    });
  });
};
</script>

<style scoped lang="scss"></style>
