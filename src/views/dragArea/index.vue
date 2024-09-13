<template>
  <div class="main">
    <div class="dragArea nested-sortable">
      <div class="dragArea_item nested-sortable" data-id="item_1">
        <div
          v-if="layoutStore.chartsVisable"
          class="demo nested-1"
          data-id="demo_1"
          data-minWidth="350"
        >
          <HolderOutlined
            v-show="chartType === 'single'"
            class="handle"
            style="float: left"
          />
          <ChartList
            v-if="!chartInitStore.loading"
            class="container_item"
            :loading="chartSubStore.chartsLoading"
          >
          </ChartList>
        </div>
        <div
          v-if="layoutStore.symbolsVisable"
          class="demo nested-1"
          data-id="demo_2"
          data-minWidth="345"
        >
          <HolderOutlined v-show="chartType === 'single'" class="handle" />
          <SymbolList class="container_item"></SymbolList>
        </div>
      </div>
      <div class="dragArea_item nested-sortable" data-id="item_2">
        <div
          v-if="layoutStore.orderAreaVisable"
          class="demo nested-2"
          data-id="demo_3"
          data-minWidth="445"
        >
          <HolderOutlined v-show="chartType === 'single'" class="handle" />
          <OrderArea
            v-if="!chartInitStore.loading"
            class="container_item"
          ></OrderArea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { HolderOutlined } from "@ant-design/icons-vue";

import { useLayout } from "@/store/modules/layout";
import { useChartSub } from "@/store/modules/chartSub";
import { useChartInit } from "@/store/modules/chartInit";

import OrderArea from "../orderArea/index.vue";
import SymbolList from "./SymbolList.vue";
import ChartList from "./ChartList.vue";

import { initDragResize } from "@/utils/dragResize/drag";

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();
const layoutStore = useLayout();

const chartType = computed(() => {
  return chartInitStore.chartLayoutType;
});

onMounted(() => {
  initDragResize();
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.main {
  padding: 5px 0;
}

.dragArea {
  height: calc(100vh - 30px - 48px - 10px);
  width: 100vw;
  position: relative;
  gap: 5px;
  display: flex;
  flex-direction: column;

  .dragArea_item {
    width: 100%;
    height: 100%;
    display: flex;
    gap: 5px;

    .demo {
      height: 100%;
      width: 100%;
      user-select: none;
      @include background_color("background-component");
      flex-grow: 1;

      .container_item {
        width: 100%;
        height: 100%;
      }

      .handle {
        height: 24px;
        width: 16px;
        cursor: grab;
        @include background_color("border");
      }
    }
  }
}
</style>
