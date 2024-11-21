<template>
  <div class="charts">
    <HorizontalScrolling v-if="chartType === 'single'">
      <div class="tabs">
        <chartTab
          v-for="chart in chartInitStore.chartWidgetList"
          :active="activedId === chart.id"
          :symbol="chart.symbol"
          :interval="chart.interval"
          :id="chart.id"
          @tabClick="chartTabClick($event, chart.symbol)"
          @symbolCommand="symbolCommand"
          @resolutionCommand="resolutionCommand"
          @tabClose="tabClose"
        ></chartTab>
      </div>
    </HorizontalScrolling>
    <div
      class="charts_container"
      :style="{
        flexDirection: chartInitStore.chartFlexDirection,
        height: chartType === 'single' ? 'calc(100% - 40px)' : '100%',
      }"
    >
      <div
        class="charts_container_item"
        v-for="{ id, symbol, interval } in chartInitStore.chartWidgetList"
        v-show="activedId === id || chartType === 'multiple'"
      >
        <chartTab
          style="width: 100%"
          v-if="chartType === 'multiple'"
          active
          noActiveStyle
          :symbol="symbol"
          :interval="interval"
          :id="id"
          @tabClick="chartTabClick($event, symbol)"
          @symbolCommand="symbolCommand"
          @resolutionCommand="resolutionCommand"
          @tabClose="tabClose"
        ></chartTab>
        <TVChart
          :style="{
            height: chartType === 'single' ? '100%' : 'calc(100% - 40px)',
          }"
          :chartId="id"
          :loading="
            chartSubStore.chartsLoading || chartInitStore.chartLoading[id]
          "
          :datafeed="datafeed(id)"
          :symbol="symbol"
          :theme="themeStore.systemTheme"
          :disabledFeatures="disabledFeatures"
          @initChart="initChart"
        >
        </TVChart>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import Sortable from "sortablejs";

import { useChartInit } from "@/store/modules/chartInit";
import { useChartAction } from "@/store/modules/chartAction";
import { useTheme } from "@/store/modules/theme";
import { useChartSub } from "@/store/modules/chartSub";
import { useOrder } from "@/store/modules/order";

import { datafeed } from "@/config/chartConfig";

import chartTab from "./components/chartTab/index.vue";

const chartInitStore = useChartInit();
const chartActionStore = useChartAction();
const themeStore = useTheme();
const chartSubStore = useChartSub();
const orderStore = useOrder();

const disabledFeatures = [
  "header_compare",
  "header_saveload",
  "timeframes_toolbar",
  "header_symbol_search",
  "symbol_search_hot_key",
  "header_resolutions",
];

const chartType = computed(() => {
  return chartInitStore.chartLayoutType;
});

const activedId = computed(() => {
  return chartInitStore.activeChartId;
});

const initChart = ({ id, widget }: any) => {
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
  chartActionStore.addOrderBtn(id);
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

const chartTabClick = (id: string, symbol?: string) => {
  chartInitStore.activeChartId = id;
  if (symbol) {
    orderStore.currentSymbol = symbol;
  }
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
  @include background_color("background");
  padding-left: 3px;
  .tabs {
    display: flex;
    gap: 4px;
    @include background_color("background-component");
  }

  &_container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    box-sizing: border-box;
    padding: 4px;
    @include background_color("background");

    &_item {
      flex: 1;
      min-width: 316px;
      position: relative;
      @include background_color("background-component");
    }
  }
}

.handle {
  cursor: grab;
  height: 24px;
  width: 16px;
  @include background_color("border");
}
</style>
