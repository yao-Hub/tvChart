<template>
  <div v-show="!props.hidden" ref="chartContainer" class="TVChart"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import * as library from "../../public/charting_library";

import { timezoneOptions } from "@/constants/timezone";
import eventBus from "utils/eventBus";

import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import { Ttime, useTime } from "@/store/modules/time";
import { useTheme } from "@/store/modules/theme";
import { useStorage } from "@/store/modules/storage";

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();
const timeStore = useTime();
const themeStore = useTheme();

const { locale } = useI18n();

interface IProps {
  interval: library.ResolutionString;
  chartId: string;
  hidden: boolean;
  client_id: string;
  user_id: string;
  datafeed: library.IBasicDataFeed;
  symbol: string;
  timezone: library.Timezone;
  disabledFeatures: library.ChartingLibraryFeatureset[];
  enabledFeatures: library.ChartingLibraryFeatureset[];
}

const props = withDefaults(defineProps<IProps>(), {
  timezone: "Asia/Shanghai",
  hidden: false,
  interval: "60" as library.ResolutionString,
});

const chartContainer = ref();

const emit = defineEmits(["initChart"]);

onMounted(() => {
  try {
    initonReady();
  } catch (error) {}
});

const localeMap: Record<string, library.LanguageCode> = {
  zhTw: "zh_TW",
  zh: "zh",
  en: "en",
};

watch(
  () => themeStore.systemTheme,
  (theme) => {
    chartInitStore.state.chartWidgetList.forEach((chart) => {
      chart.widget?.setCSSCustomProperty(
        "--tv-color-pane-background",
        theme === "dark" ? "#17181A" : "#FFFFFF"
      );
    });
  }
);

const initonReady = () => {
  if (!props.chartId) {
    return new Error("chartId is no defined");
  }
  const widgetOptions: library.ChartingLibraryWidgetOptions = {
    symbol: props.symbol,
    interval: props.interval,
    container: chartContainer.value,
    datafeed: props.datafeed,
    timezone: props.timezone,
    library_path: "charting_library/",
    custom_css_url: "static/tvcss.css",
    locale: localeMap[locale.value] || locale.value,
    client_id: props.client_id,
    user_id: props.user_id,
    theme: themeStore.systemTheme,
    enabled_features: props.enabledFeatures,
    disabled_features: props.disabledFeatures,
    custom_timezones: timezoneOptions as library.CustomAliasedTimezone[],
    autosize: true,
    overrides: {},
  };

  // 图表刷新key
  chartInitStore.state.chartFreshKeys[props.chartId] = 0;

  // 读取缓存数据
  const savedData = chartInitStore.getChartSavedData(props.chartId);
  if (savedData && Object.keys(savedData).length) {
    widgetOptions.saved_data = savedData;
  }

  // 实例化
  const widget: library.IChartingLibraryWidget = new library.widget(
    widgetOptions
  );

  // 图表开始加载标志
  chartInitStore.setChartLoadingType(props.chartId, false);

  widget?.headerReady().then(() => {
    widget?.onChartReady(() => {
      chartInitStore.createChartWidget(props.chartId, widget);

      // 快捷键监听
      chartSubStore.subscribeKeydown(widget);

      widget.subscribe("mouse_up", () => {
        eventBus.emit("chartMouseUp", props.chartId);
      });

      // 监听数据加载完毕
      widget
        .activeChart()
        .onDataLoaded()
        .subscribe(
          null,
          () => {
            chartInitStore.setChartLoadingType(props.chartId, true);
          },
          false
        );

      // 监听商品变化 同步chartWidgetList
      widget
        .activeChart()
        .onSymbolChanged()
        .subscribe({}, () => {
          const newSymbol = widget.activeChart().symbol();
          const target = chartInitStore.state.chartWidgetList.find(
            (e) => e.id === props.chartId
          );
          if (target && target.symbol !== newSymbol) {
            target.symbol = newSymbol;
          }

          chartInitStore.setChartLoadingType(props.chartId, false);

          widget.activeChart().executeActionById("timeScaleReset");

          // 保存图表
          chartInitStore.saveCharts();
        });

      // 监听周期变化 同步chartWidgetList
      widget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (interval) => {
          const target = chartInitStore.state.chartWidgetList.find(
            (e) => e.id === props.chartId
          );
          if (target && target.interval !== interval) {
            target.interval = interval;
          }

          chartInitStore.setChartLoadingType(props.chartId, false);

          chartInitStore.saveCharts();
        });

      // 增加策略 第一个图表增加指标
      if (!savedData && chartInitStore.state.chartWidgetList.length === 1) {
        // widget.activeChart().createStudy("MACD");
        widget.activeChart().createStudy("Moving Average Double");
      }

      // 图表时区初始化设置
      widget
        .activeChart()
        .getTimezoneApi()
        .setTimezone(timeStore.settedTimezone as Ttime);

      // 图表主题改变
      widget
        .activeChart()
        .onChartTypeChanged()
        .subscribe(null, () => {
          setTimeout(() => {
            themeStore.getIframesColorScheme();
          });
        });

      // canvas图表主题
      const storageThemeMap = useStorage().getItem("chartThemeMap") || {};
      const chart_theme = storageThemeMap[props.chartId];
      const sysTheme = themeStore.systemTheme;
      if (chart_theme !== sysTheme) {
        widget.changeTheme(sysTheme as library.ThemeName);
      }

      // 涨跌颜色
      themeStore.setUpDownTheme({ chartId: props.chartId });

      // 设置功能栏背景色
      widget.setCSSCustomProperty(
        "--tv-color-pane-background",
        sysTheme === "dark" ? "#17181A" : "#FFFFFF"
      );

      // 清除骨架屏效果
      if (chartContainer.value) {
        const chartEl = chartContainer.value;
        chartEl.classList.remove("TVChart");
      }
      emit("initChart", { id: props.chartId, widget });
    });
  });
};
</script>

<style scoped lang="scss">
@import "@/styles/_handle.scss";

.TVChart {
  position: relative;
  overflow: hidden;
  height: 100%;
}

/* 闪光动画效果 */
.TVChart::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    var(--chart-skeleton-color),
    transparent
  );
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}
</style>
