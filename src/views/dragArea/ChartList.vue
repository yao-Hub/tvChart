<template>
  <div
    class="charts"
    :style="{
      padding: chartType === 'single' ? '0 4px 4px 4px' : '4px',
    }"
  >
    <HorizontalScrolling v-if="chartType === 'single'">
      <div class="tabs">
        <chartTab
          v-for="chart in chartInitStore.state.chartWidgetList"
          :active="activedId === chart.id"
          :symbol="chart.symbol"
          :interval="chart.interval"
          :id="chart.id"
          @tabClick="chartTabClick(chart.id)"
          @symbolCommand="symbolCommand"
          @resolutionCommand="resolutionCommand"
          @tabClose="tabClose"
        ></chartTab>
      </div>
    </HorizontalScrolling>
    <div
      :class="[
        'charts_container',
        chartType === 'single' ? 'chart_sin' : 'chart_mul',
      ]"
      :style="{
        flexDirection: chartInitStore.state.chartFlexDirection,
      }"
    >
      <div
        class="charts_container_item"
        v-for="{ id, symbol, interval } in chartInitStore.state.chartWidgetList"
        :key="id"
        v-show="activedId === id || chartType === 'multiple'"
      >
        <chartTab
          style="width: 100%; border: none"
          v-if="chartType === 'multiple'"
          active
          noActiveStyle
          noHoverStyle
          :symbol="symbol"
          :interval="interval"
          :id="id"
          @tabClick="chartTabClick(id)"
          @symbolCommand="symbolCommand"
          @resolutionCommand="resolutionCommand"
          @tabClose="tabClose"
        ></chartTab>
        <TVChart
          :style="{
            height:
              chartType === 'single' ? '100%' : 'calc(100% - var(--size))',
          }"
          :chartId="id"
          :loading="
            chartSubStore.chartsLoading || chartInitStore.state.chartLoading[id]
          "
          :client_id="`${id}_client_id`"
          :user_id="`${id}_user_id`"
          :datafeed="datafeed(id)"
          :symbol="symbol"
          :theme="themeStore.systemTheme"
          :timezone="timeStore.settedTimezone"
          :disabledFeatures="disabledFeatures"
          @initChart="initChart"
        >
        </TVChart>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IChartingLibraryWidget } from "public/charting_library";
import Sortable from "sortablejs";
import { computed, onMounted } from "vue";

import { useChartAction } from "@/store/modules/chartAction";
import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import { useTheme } from "@/store/modules/theme";
import { useTime } from "@/store/modules/time";

import { datafeed } from "@/config/chartConfig";

import chartTab from "./components/chartTab/index.vue";

const chartInitStore = useChartInit();
const chartActionStore = useChartAction();
const themeStore = useTheme();
const chartSubStore = useChartSub();
const timeStore = useTime();

const disabledFeatures = [
  "header_compare",
  "header_saveload",
  "timeframes_toolbar",
  "header_symbol_search",
  "symbol_search_hot_key",
  "header_resolutions",
];

const chartType = computed(() => {
  return chartInitStore.state.chartLayoutType;
});

const activedId = computed(() => {
  return chartInitStore.state.activeChartId;
});

const initChart = ({
  id,
  widget,
}: {
  id: string;
  widget: IChartingLibraryWidget;
}) => {
  // widget.chart().createShape(
  //   { time: 1730771118, price: 2737 },
  //   {
  //     shape: "icon",
  //     icon: 0xf0d8,
  //     lock: true,
  //     disableSelection: true,
  //     zOrder: "top",
  //     overrides: {
  //       color: "red",
  //       size: 12,
  //     },
  //   }
  // );
  // if (chartType.value === "multiple") {
  //   widget.activeChart().executeActionById("drawingToolbarAction");
  // }
  // const from = Date.now() / 1000 - 15 * 60 * 60; // 5 days ago
  // const to = Date.now() / 1000;
  // widget.activeChart().createMultipointShape(
  //   [
  //     { time: from, price: 2710 },
  //     { time: to, price: 2710 },
  //   ],
  //   {
  //     shape: "trend_line",
  //     lock: false,
  //     disableSelection: true,
  //     disableSave: true,
  //     disableUndo: true,
  //     text: "texttexttexttexttexttexttexttext",
  //   }
  // );
  // widget.chart().createAnchoredShape(
  //   { x: 0.1, y: 0.9 },
  //   {
  //     shape: "anchored_text",
  //     text: "Hello, charts!",
  //     overrides: { color: "green" },
  //   }
  // );

  // 涨跌颜色
  themeStore.setUpDownTheme();
  // 创建顶部栏快捷下单按钮
  chartActionStore.addOrderBtn(id);
  // 图表已经加载完毕
  chartInitStore.setChartLoadingEndType(id, true);
  // chartActionStore.createOrderLine(id);
};

onMounted(() => {
  const dragArea = document.querySelector(".charts_container");
  new Sortable(dragArea, {
    animation: 150,
    swapThreshold: 1,
    handle: ".moveIcon",
    onStart: () => {
      chartInitStore.saveCharts();
    },
    onEnd: function () {
      setTimeout(() => {
        chartInitStore.loadCharts();
      }, 500);
    },
  });

  const tabs = document.querySelector(".tabs");
  if (tabs) {
    new Sortable(tabs, {
      animation: 150,
      swapThreshold: 0.65,
      handle: ".moveIcon",
    });
  }

  window.addEventListener("beforeunload", () => {
    chartInitStore.saveCharts();
  });
});

const chartTabClick = (id: string) => {
  chartInitStore.state.activeChartId = id;
};
const symbolCommand = (symbol: string, id: string) => {
  chartInitStore.changeChartSymbol({ symbol, id });
};
const resolutionCommand = (resolution: any, id: string) => {
  chartInitStore.changeChartInterval({ resolution, id });
};
const tabClose = (id: string) => {
  chartInitStore.removeChartWidget(id);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.charts {
  box-sizing: border-box;
  @include background_color("background-component");
  .tabs {
    display: flex;
    gap: 4px;
    @include background_color("background");
  }

  .charts_container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    box-sizing: border-box;
    @include background_color("background-component");

    &_item {
      flex: 1;
      min-width: 316px;
      position: relative;
      // @include background_color("background-component");
    }
  }
  .chart_sin {
    height: calc(100% - var(--size) - 4px);
    margin-top: 4px;
  }
  .chart_mul {
    height: calc(100% - 4px);
  }
}
</style>
