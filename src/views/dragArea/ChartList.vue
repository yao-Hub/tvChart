<template>
  <div
    class="charts"
    :style="{ paddingLeft: chartType === 'single' ? '4px' : '16px' }"
  >
    <HorizontalScrolling
      v-if="chartType === 'single'"
      style="margin-left: 16px"
    >
      <div class="tabs">
        <chartTab
          v-for="chart in chartInitStore.state.chartWidgetList"
          :active="activedId === chart.id"
          :symbol="chart.symbol"
          :interval="chart.interval"
          :id="chart.id"
          :hide-close-btn="chartInitStore.state.chartWidgetList.length === 1"
          @tabClick="handleTabClick"
          @symbolCommand="symbolCommand"
          @resolutionCommand="resolutionCommand"
          @tabClose="tabClose"
        ></chartTab>
      </div>
    </HorizontalScrolling>
    <div
      class="charts_container scrollList"
      :style="chartInitStore.chartStyles"
    >
      <div
        class="charts_container_item"
        v-for="({ id, symbol, interval }, index) in chartInitStore.state
          .chartWidgetList"
        v-show="activedId === id || chartType !== 'single'"
        :ref="(el: any) => setChartRef(el, id)"
        :key="id + index"
        :id="id"
        :style="{ borderColor: getBorderColorStyle(id) }"
      >
        <chartTab
          v-if="chartType !== 'single'"
          active
          noActiveStyle
          noHoverStyle
          :hide-close-btn="chartInitStore.state.chartWidgetList.length === 1"
          :symbol="symbol"
          :interval="interval"
          :id="id"
          @tabClick="handleTabClick"
          @symbolCommand="symbolCommand"
          @resolutionCommand="resolutionCommand"
          @tabClose="tabClose"
        ></chartTab>
        <TVChart
          style="flex: 1"
          :interval="interval"
          :chartId="id"
          :key="chartInitStore.state.chartFreshKeys[id]"
          :loading="
            chartSubStore.chartsLoading || chartInitStore.state.chartLoading[id]
          "
          :client_id="`${id}_client_id`"
          :user_id="`${id}_user_id`"
          :datafeed="datafeed(id)"
          :symbol="symbol"
          :timezone="timeStore.settedTimezone"
          :disabledFeatures="disabledFeatures"
          :enabledFeatures="enabledFeatures"
          @initChart="initChart"
        >
        </TVChart>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ResolutionString } from "public/charting_library";
import Sortable from "sortablejs";
import { computed, onMounted, ref } from "vue";

import { useChartAction } from "@/store/modules/chartAction";
import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import { useTime } from "@/store/modules/time";

import { datafeed } from "@/config/chartConfig";
import { repositionArr } from "utils/common";

import chartTab from "./components/chartTab/index.vue";

const chartInitStore = useChartInit();
const chartActionStore = useChartAction();
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
const enabledFeatures = ["disable_resolution_rebuild"];

const chartType = computed(() => {
  return chartInitStore.state.chartLayoutType;
});

const activedId = computed(() => {
  return chartInitStore.state.activeChartId;
});

const getBorderColorStyle = (id: string) => {
  if (chartType.value === "single") {
    return "transparent";
  }
  if (chartInitStore.state.chartWidgetList.length === 1) {
    return "transparent";
  }
  if (chartInitStore.state.activeChartId === id) {
    return "rgba(244, 178, 1, 0.5)";
  }
  return "transparent";
};

// 筛选行点击
const handleTabClick = (id: string) => {
  chartInitStore.state.activeChartId = id;
};
// 品种选择
const symbolCommand = (symbol: string, id: string) => {
  chartInitStore.changeChartSymbol({ symbol, id });
};
// 周期选择
const resolutionCommand = (resolution: ResolutionString, id: string) => {
  chartInitStore.changeChartInterval({ resolution, id });
};
// 图表关闭
const tabClose = (id: string) => {
  chartInitStore.removeChartWidget(id);
};

// 存储图表引用的对象
const chartRefs = ref<Record<string, any>>({});
const setChartRef = (el: any, id: string) => {
  if (el) {
    chartRefs.value[id] = el;
  }
};

const initChart = ({ id }: { id: string }) => {
  // 创建顶部栏快捷下单按钮
  chartActionStore.addOrderBtn(id);

  // 捕获iframe
  const chartDom = chartRefs.value[id];
  chartActionStore.handleChartIframeMousedown(chartDom, id);

  // 图表已经加载完毕
  chartInitStore.setChartLoadingEndType(id, true);
  // chartActionStore.createOrderLine(id);
};

onMounted(() => {
  // 图表拖拽
  const dragArea = document.querySelector(".charts_container");
  new Sortable(dragArea, {
    animation: 150,
    swapThreshold: 1,
    handle: ".moveIcon",
    onStart: () => {
      chartInitStore.saveCharts();
    },
    onEnd: (evt: any) => {
      const { oldIndex, newIndex } = evt;
      repositionArr({
        oldIndex,
        newIndex,
        arr: chartInitStore.state.chartWidgetList,
      });
    },
  });

  // tab拖拽
  const tabs = document.querySelector(".tabs");
  if (tabs) {
    new Sortable(tabs, {
      animation: 150,
      swapThreshold: 0.65,
      handle: ".moveIcon",
    });
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.charts {
  box-sizing: border-box;
  @include background_color("background-component");
  padding: 4px;
  display: flex;
  flex-direction: column;
  float: left;
  width: 100%;
  margin-left: -16px;
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 2px;
  }

  .charts_container {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    box-sizing: border-box;
    overflow-y: auto;
    @include background_color("background-component");

    &_item {
      border: 1px solid;
      box-sizing: border-box;
      flex: 1 1 calc(50% - 4px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 254px;
      min-height: 150px;
    }
  }
}
</style>
