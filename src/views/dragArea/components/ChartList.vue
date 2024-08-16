<template>
  <div class="charts">
    <baseTabs class="charts_tabs" addable v-model:activeKey="state.activeKey" @handleAdd="tabAdd">
      <TabItem
        v-for="chart in chartList"
        :tab="chart.symbol"
        :activeKey="chart.id"
        :key="chart.id"
        :closable="chart.id !== 'chart_1'"
        @itemDel="tabDelete"
      ></TabItem>
    </baseTabs>
    <div class="charts_container">
      <div
        class="charts_container_item"
        v-for="{ id } in chartList"
        :style="{ paddingLeft: chartType === 'multiple' ? '20px' : 0 }"
        :key="id"
        :id="id"
        v-show="
          (state.activeKey === id && chartType === 'single') ||
          chartType === 'multiple'
        "
      >
        <HolderOutlined class="handle" v-if="chartType === 'multiple'" />
        <TVChart
          style="flex: 1; height: 100%"
          :key="state.activeKey === id"
          :chartId="id"
          :mainChart="id === 'chart_1'"
          :loading="props.loading || chartInitStore.singleChartLoading[id]"
          :datafeed="datafeed(id)"
          :symbol="state.symbol"
          :disabledFeatures="id === state.activeKey ? [] : ['left_toolbar']"
          :compareSymbols="compareSymbols"
          @initChart="initChart"
        >
        </TVChart>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from "vue";
import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import { useOrder } from "@/store/modules/order";
import { datafeed } from "@/config/chartConfig";
import * as types from "@/types/chart/index";
import { HolderOutlined } from "@ant-design/icons-vue";
import Sortable from "sortablejs";

const chartSubStore = useChartSub();
const chartInitStore = useChartInit();
const orderStore = useOrder();

interface Props {
  loading?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const state = reactive({
  symbol: "XAU",
  activeKey: "chart_1",
});

const compareSymbols = computed(() => {
  if (chartSubStore.symbols) {
    return chartSubStore.symbols.map((item: types.SessionSymbolInfo) => {
      return {
        symbol: item.symbol,
        title: item.symbol,
      };
    });
  }
});

const chartList = computed(() => {
  return chartInitStore.chartWidgetList;
});

const chartType = computed(() => {
  return chartInitStore.chartLayoutType;
});

// widget初始化回调
const initChart = (e: any) => {
  // 监听点击报价加号按钮
  // chartSubStore.subscribePlusBtn();
  // chartSubStore.subscribeMouseDown();
  if (orderStore.ifQuick) {
    orderStore.addOrderBtn();
  }
};

onMounted(() => {
  const dragArea = document.querySelector(".charts_container");
  new Sortable(dragArea, {
    animation: 150,
    swapThreshold: 1,
    handle: ".handle",
    onEnd: function (evt: any) {
      setTimeout(() => chartInitStore.setSymbolBack(), 200);
      if (dragArea) {
        const conItems = Array.from(
          dragArea.querySelectorAll(".charts_container_item")
        );
        const chartIdList = conItems.map((item) => {
          const id = item.getAttribute("id");
          return id;
        });
        chartInitStore.sortChartList(chartIdList as string[]);
      }
    },
  });
});

const tabDelete = (targetKey: string) => {
  chartInitStore.removeChartWidget(targetKey);
  if (targetKey === state.activeKey) {
    const lastChart = chartInitStore.chartWidgetList.slice(-1);
    state.activeKey = lastChart[0].id;
  }
};

const tabAdd = async () => {
  const len = chartInitStore.chartWidgetList.length;
  chartInitStore.chartWidgetList.push({
    id: `chart_${len + 1}`,
  });
  state.activeKey = `chart_${len + 1}`;
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.charts {
  box-sizing: border-box;
  border-radius: 5px;
  height: calc(100% - 24px);

  &_container {
    display: flex;
    flex-wrap: wrap;
    height: 100%;
    gap: 5px;
    box-sizing: border-box;
    height: 100%;
    &_item {
      flex: 1;
      position: relative;
      box-sizing: border-box;
      .handle {
        cursor: grab;
        position: absolute;
        top: 0;
        left: 0;
        height: 24px;
        width: 16px;
        @include background_color("border");
      }
    }
  }

  &_tabs {
    overflow-x: auto;
    overflow-y: hidden;
    margin-left: 16px;
  }
}
</style>
