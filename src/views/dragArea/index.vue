<template>
  <div class="dragArea">
    <div
      class="dragArea_item nested-sortable"
      data-id="item_1"
      data-child="demo_1 | demo_2"
    >
      <!-- demo_1 -->
      <div
        class="demo nested-1"
        data-id="demo_1"
        data-minWidth="350"
        v-if="layoutStore.chartsVisable"
      >
        <div class="handle" style="padding-top: 4px"></div>
        <ChartList v-if="!chartInitStore.state.loading" class="container_item">
        </ChartList>
      </div>
      <!-- demo_2 -->
      <div
        class="demo nested-1"
        data-id="demo_2"
        data-minWidth="360"
        data-initW="480"
        v-if="layoutStore.symbolsVisable"
      >
        <div class="handle" style="padding-top: 8px"></div>
        <SymbolList class="container_item"></SymbolList>
      </div>
    </div>
    <div
      class="dragArea_item nested-sortable"
      data-id="item_2"
      data-child="demo_3"
      data-initH="248"
    >
      <!-- demo_3 -->
      <div
        class="demo nested-1"
        data-id="demo_3"
        data-minWidth="445"
        v-if="layoutStore.orderAreaVisable"
      >
        <div class="handle" style="padding-top: 4px"></div>
        <OrderArea
          v-if="!chartInitStore.state.loading"
          class="container_item"
        ></OrderArea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";
import { useLayout } from "@/store/modules/layout";

import OrderArea from "../orderArea/index.vue";
import ChartList from "./ChartList.vue";
import SymbolList from "./SymbolList.vue";

const chartInitStore = useChartInit();
const layoutStore = useLayout();
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.dragArea {
  height: calc(100vh - 30px - 48px);
  width: 100%;
  position: relative;
  overflow: hidden;
  @include background_color("background-component");

  .dragArea_item {
    width: 100%;
    box-sizing: border-box;
    position: relative;

    .demo {
      box-sizing: border-box;
      position: absolute;
      user-select: none;
      overflow: hidden;
      border-radius: 4px;
      height: 100%;

      .container_item {
        height: 100%;
      }

      .handle {
        height: var(--size);
        width: 16px;
        cursor: grab;
        background-image: url("@/assets/icons/icon_drag1.svg");
        background-repeat: no-repeat;
        background-position: center;
        background-clip: content-box;
        float: left;
        box-sizing: border-box;
        @include background_color("background");
      }
    }
  }
}
</style>
