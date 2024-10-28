<template>
  <div class="charts">
    <baseTabs
      class="charts_tabs"
      addable
      v-model:activeKey="chartInitStore.activeChartId"
      v-if="chartType === 'single'"
      @handleAdd="tabAdd"
    >
      <TabItem
        v-for="chart in chartList"
        :tab="chart.symbol"
        :value="chart.id"
        :closable="chart.id !== 'chart_1'"
        @itemDel="tabDelete"
      ></TabItem>
    </baseTabs>
    <div
      class="charts_container"
      :style="{ flexDirection: chartInitStore.chartFlexDirection }"
    >
      <div
        class="charts_container_item"
        v-for="{ id, symbol } in chartList"
        :key="id"
        v-show="chartInitStore.activeChartId === id || chartType === 'multiple'"
      >
        <div v-if="chartType === 'multiple'" style="display: flex">
          <img class="handle" src="@/assets/icons/move.png" />
          <baseTabs
            v-model:activeKey="chartInitStore.activeChartId"
            addable
            @handleAdd="tabAdd"
          >
            <TabItem
              :tab="symbol"
              :closable="chartList.length > 1"
              :value="id"
              @itemDel="tabDelete"
            ></TabItem>
          </baseTabs>
        </div>
        <TVChart
          style="height: calc(100% - 24px)"
          :key="chartType === 'single' || chartList.length === 1"
          :chartId="id"
          :mainChart="id === 'chart_1'"
          :loading="props.loading || chartInitStore.chartLoading[id]"
          :datafeed="datafeed(id)"
          :symbol="symbol || state.symbol"
          :theme="themeStore.systemTheme"
          :disabledFeatures="
            chartType === 'single' || chartList.length === 1
              ? state.disabledFeatures
              : ['left_toolbar', ...state.disabledFeatures]
          "
          @initChart="initChart"
        >
        </TVChart>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from "vue";
import Sortable from "sortablejs";

import { useChartInit } from "@/store/modules/chartInit";
import { useChartAction } from "@/store/modules/chartAction";
import { useTheme } from "@/store/modules/theme";

import { datafeed } from "@/config/chartConfig";

const chartInitStore = useChartInit();
const chartActionStore = useChartAction();
const themeStore = useTheme();

interface Props {
  loading?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const state = reactive({
  symbol: "XAU",
  disabledFeatures: [
    "header_compare",
    "header_saveload",
    "timeframes_toolbar",
    "save_chart_properties_to_local_storage",
    "use_localstorage_for_settings",
  ],
});

const chartList = computed(() => {
  return chartInitStore.chartWidgetList;
});

const chartType = computed(() => {
  return chartInitStore.chartLayoutType;
});

const initChart = ({ id }: any) => {
  // 涨跌颜色
  themeStore.setUpDownTheme();
  chartActionStore.addOrderBtn(id);
};

onMounted(() => {
  const dragArea = document.querySelector(".charts_container");
  new Sortable(dragArea, {
    animation: 150,
    swapThreshold: 1,
    handle: ".handle",
    onEnd: function (evt: any) {
      setTimeout(() => {
        chartInitStore.syncSetChart();
      }, 500);
    },
  });
});

const tabDelete = (targetKey: string) => {
  chartInitStore.removeChartWidget(targetKey);
  console.log(chartInitStore.chartWidgetList);
};

const tabAdd = () => {
  const ids = chartList.value.map((item) => +item.id.split("_")[1]);
  const minId = Math.min(...ids) as number;
  const maxId = Math.max(...ids) as number;
  const fullRange = new Set(
    [...Array(maxId - minId + 1).keys()].map((i) => i + minId)
  );
  const arrSet = new Set(ids);
  const missingIds = [...fullRange].filter((num) => !arrSet.has(num));
  const addId = missingIds.length ? missingIds[0] : maxId + 1;
  chartInitStore.chartWidgetList.push({ id: `chart_${addId}` });
  console.log(chartInitStore.chartWidgetList);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.charts {
  box-sizing: border-box;
  border-radius: 5px;
  &_container {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    box-sizing: border-box;
    height: 100%;
    &_item {
      flex: 1;
      min-width: 316px;
      position: relative;
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
