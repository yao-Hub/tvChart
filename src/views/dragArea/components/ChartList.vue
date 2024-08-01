<template>
  <div class="charts">
    <a-tabs
      class="charts_tabs"
      v-model:activeKey="state.activeKey"
      type="editable-card"
      @edit="onEdit"
      size="small"
    >
      <a-tab-pane
        v-for="chart in chartList"
        :key="chart.id"
        :tab="chart.symbol"
        :closable="chart.id !== 'chart_1'"
      >
      </a-tab-pane>
    </a-tabs>
    <div class="charts_container">
      <div
        :style="{ paddingLeft: chartType === 'multiple' ? '20px' : 0 }"
        class="charts_container_item"
        v-for="{ id } in chartList"
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
import { useChartAction } from "@/store/modules/chartAction";
import { datafeed } from "@/config/chartConfig";
import * as types from "@/types/chart/index";
import { HolderOutlined } from "@ant-design/icons-vue";
import Sortable from "sortablejs";

const chartSubStore = useChartSub();
const chartInitStore = useChartInit();
const chartActionStore = useChartAction();

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
  chartActionStore.addOrderBtn(e.id);
  chartSubStore.subscribeKeydown();
};

onMounted(() => {
  const dragArea = document.querySelector(".charts_container");
  new Sortable(dragArea, {
    animation: 150,
    swapThreshold: 1,
    handle: ".handle",
    onEnd: function (evt: any) {
      chartInitStore.setChartSymbolWithCache(evt.item.id);
    },
  });
});

const onEdit = async (targetKey: string, action: string) => {
  if (action === "add") {
    const len = chartInitStore.chartWidgetList.length;
    chartInitStore.chartWidgetList.push({
      id: `chart_${len + 1}`,
    });
    state.activeKey = `chart_${len + 1}`;
  } else {
    chartInitStore.removeChartWidget(targetKey);
    if (targetKey === state.activeKey) {
      const lastChart = chartInitStore.chartWidgetList.slice(-1);
      state.activeKey = lastChart[0].id;
    }
  }
};
</script>

<style lang="scss" scoped>
.charts {
  display: flex;
  flex-direction: column;
  padding: 5px;
  box-sizing: border-box;
  border-radius: 5px;

  &_container {
    display: flex;
    flex-wrap: wrap;
    flex: 1;
    gap: 5px;
    padding-left: 20px;
    box-sizing: border-box;
    &_item {
      flex: 1;
      min-width: 200px;
      position: relative;
      background-color: #141823;
      box-sizing: border-box;

      .handle {
        cursor: grab;
        position: absolute;
        top: 10px;
        left: 5px;
      }
    }
  }

  &_tabs {
    display: flex;
    overflow-x: auto;
    margin-left: 20px;
  }
}
</style>
