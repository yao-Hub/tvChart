<template>
  <div class="charts">
    <baseTabs
      v-if="chartType === 'single'"
      v-model:activeKey="chartInitStore.activeChartId"
      class="charts_tabs"
      addable
      @handleAdd="tabAdd"
    >
      <TabItem
        v-for="(chart, index) in chartInitStore.chartWidgetList"
        :tab="chart.symbol"
        :value="chart.id"
        :closable="index !== 0"
        @itemDel="tabDelete"
      ></TabItem>
    </baseTabs>
    <div
      class="charts_container"
      :style="{ flexDirection: chartInitStore.chartFlexDirection }"
    >
      <div
        class="charts_container_item"
        v-for="{ id, symbol } in chartInitStore.chartWidgetList"
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
              :closable="chartInitStore.chartWidgetList.length > 1"
              :value="id"
              @itemDel="tabDelete"
            ></TabItem>
          </baseTabs>
        </div>
        <TVChart
          style="height: calc(100% - 24px)"
          :chartId="id"
          :loading="props.loading || chartInitStore.chartLoading[id]"
          :datafeed="datafeed(id)"
          :symbol="symbol || state.symbol"
          :theme="themeStore.systemTheme"
          :disabledFeatures="state.disabledFeatures"
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
    "header_symbol_search",
    "symbol_search_hot_key",
    "header_resolutions",
    // "save_chart_properties_to_local_storage",
    // "use_localstorage_for_settings",
  ],
});

const chartType = computed(() => {
  return chartInitStore.chartLayoutType;
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
    handle: ".handle",
    onEnd: function () {
      setTimeout(() => {
        chartInitStore.syncSetChart();
      }, 500);
    },
  });
});

const tabDelete = (targetKey: string) => {
  chartInitStore.removeChartWidget(targetKey);
};

const tabAdd = () => {
  const ids = chartInitStore.chartWidgetList.map(
    (item) => +item.id.split("_")[1]
  );
  const minId = Math.min(...ids) as number;
  const maxId = Math.max(...ids) as number;
  const fullRange = new Set(
    [...Array(maxId - minId + 1).keys()].map((i) => i + minId)
  );
  const arrSet = new Set(ids);
  const missingIds = [...fullRange].filter((num) => !arrSet.has(num));
  const addId = missingIds.length ? missingIds[0] : maxId + 1;
  chartInitStore.chartWidgetList.push({ id: `chart_${addId}` });
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
