<template>
  <div v-show="!props.loading" ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import * as library from "../../public/charting_library";

import { timezoneOptions } from "@/constants/timezone";

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
  loading: boolean;
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
  loading: false,
  interval: "60" as library.ResolutionString,
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
  chartInitStore.setChartLoadingEndType(props.chartId, false);

  widget?.headerReady().then(() => {
    widget?.onChartReady(() => {
      chartInitStore.createChartWidget(props.chartId, widget);

      // 快捷键监听
      chartSubStore.subscribeKeydown(widget);

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

      // widget.activeChart().createShape(
      //   // channel: "open" | "high" | "low" | "close";
      //   { time: new Date().getTime() - 5000, price: 0.594 },
      //   { shape: "horizontal_line" }
      // );

      // // 表示挂单（尚未成交的订单）
      // const orderLine = widget.chart().createOrderLine();
      // orderLine
      //   .setPrice(3340)
      //   .setText("orderLine 买入 STOP: 73.5 (5,64%)")
      //   .setLineLength(30)
      //   .setQuantityBackgroundColor("pink")
      //   .setLineColor("pink")
      //   .onModify("onModify called", () => {
      //     console.log("onModify called");
      //   })
      //   .onMove("move", () => {})
      //   .onCancel("", () => {});

      // 表示持仓（已成交的头寸）
      // const positionLine = widget.chart().createPositionLine();
      // positionLine
      //   .setBodyBorderColor("#008000")
      //   .setBodyBackgroundColor("#000")
      //   .setBodyTextColor("#fff") // 左边按钮字体颜色
      //   .setQuantityBorderColor("red") // 中间按钮的边框颜色
      //   .setQuantityBackgroundColor("#000") // 中间按钮的背景色

      //   .setExtendLeft(false)
      //   .setLineLength(20) // 关闭按钮距离右边的距离
      //   .setPrice(38.0)
      //   .setText(`positionLine 多头持仓 盈亏：+$75.20`)
      //   // .setQuantity("1")
      //   // .setLineColor("#fff")
      //   .onModify({ id: 111 }, (T) => {
      //     console.log(T);
      //   })
      //   .onClose("onModify onClose", (T) => {
      //     console.log(T);
      //   });

      // // 一条点到点的线
      // const from = Date.now() / 1000 - 3 * 24 * 3600; // 5 days ago
      // const to = Date.now() / 1000 - 1 * 24 * 3600;
      // widget.activeChart().createMultipointShape(
      //   [
      //     { time: from, price: 3365 },
      //     { time: to, price: 3320 },
      //   ],
      //   {
      //     shape: "trend_line",
      //     lock: true,
      //     disableSelection: true,
      //     disableSave: true,
      //     disableUndo: true,
      //     text: "这是价格",
      //     icon: 5,
      //   }
      // );

      // // 交易历史
      // const executionLine = widget.activeChart().createExecutionShape();
      // executionLine
      //   .setText("是文字@1,320.75 Limit Buy 1")
      //   .setTooltip("@1,320.75 Limit Buy 1")
      //   .setTextColor("rgba(255,0,0,0.5)") // 文本颜色
      //   .setArrowColor("green") // 箭头颜色
      //   .setDirection("buy")
      //   .setTime(Date.now() / 1000 - 60 * 60 * 9) // 60 minutes ago
      //   // .setTime(widget.activeChart().getVisibleRange().from)
      //   .setPrice(3340);

      // const executionLine_1 = widget.activeChart().createExecutionShape();
      // executionLine_1
      //   // .setText("这是文字@1,320.75 Limit Buy 1")
      //   .setTooltip("@1,320.75 Limit Buy 1")
      //   .setTextColor("rgba(0,255,0,0.5)")
      //   .setArrowColor("#0F0")
      //   .setDirection("sell")
      //   .setTime(Date.now() / 1000 - 60 * 59) // 60 minutes ago
      //   // .setTime(widget.activeChart().getVisibleRange().from)
      //   .setPrice(38.568);

      // widget
      //   .activeChart()
      //   .createExecutionShape()
      //   // .setText("这是文字@1,320.75 Limit Buy 1")
      //   .setTooltip("@1,320.75 Limit Buy 1")
      //   .setTextColor("rgba(0,255,0,0.5)")
      //   .setArrowColor("#0F0")
      //   .setDirection("sell")
      //   .setTime(Date.now() / 1000 - 60 * 59) // 60 minutes ago
      //   // .setTime(widget.activeChart().getVisibleRange().from)
      //   .setPrice(38.564);
      // widget.activeChart().createShape(
      //   {
      //     price: 38.94,
      //     time: Date.now() / 1000 - 60 * 59,
      //   },
      //   {
      //     shape: "arrow_up",
      //     disableSave: true,
      //     lock: true,
      //     text: "text",
      //     disableUndo: true,
      //     disableSelection: true,
      //   }
      // );
      emit("initChart", { id: props.chartId, widget });
    });
  });
};
</script>

<style scoped lang="scss"></style>
