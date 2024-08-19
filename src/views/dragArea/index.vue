<template>
  <div class="dragArea">
    <div class="dragArea_item">
      <div class="demo" v-if="layoutStore.chartsVisable">
        <HolderOutlined class="handle" />
        <ChartList
          v-if="!chartInitStore.loading"
          class="container_item"
          :loading="chartSubStore.chartsLoading"
        ></ChartList>
      </div>
      <div class="demo" v-if="layoutStore.symbolsVisable">
        <HolderOutlined class="handle" />
        <SymbolList class="container_item"></SymbolList>
      </div>
    </div>
    <div class="dragArea_item">
      <div class="demo" v-if="layoutStore.orderAreaVisable">
        <HolderOutlined class="handle" />
        <OrderArea
          v-if="!chartInitStore.loading"
          class="container_item"
        ></OrderArea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HolderOutlined } from "@ant-design/icons-vue";

import { useLayout } from "@/store/modules/layout";
import { useChartSub } from "@/store/modules/chartSub";
import { useChartInit } from "@/store/modules/chartInit";

import OrderArea from "../orderArea/index.vue";
import SymbolList from "./components/SymbolList.vue";
import ChartList from "./components/ChartList.vue";

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();
const layoutStore = useLayout();
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.dragArea {
  height: calc(100vh - 30px - 48px);
  width: 100%;
  box-sizing: border-box;
  position: relative;

  .dragArea_item {
    width: 100%;
    box-sizing: border-box;
    position: relative;

    .demo {
      padding: 0 5px 5px 0;
      box-sizing: border-box;
      position: absolute;
      user-select: none;
      overflow: auto;
      @include background_color("background-component");

      .container_item {
        width: 100%;
      }

      .handle {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 2;
        height: 24px;
        width: 16px;
        cursor: grab;
        @include background_color("border");
      }
    }
  }
}
</style>
