<template>
  <div class="dragArea">
    <div class="dragArea_item nested-sortable" data-id="item_1" data-child="demo_1 | demo_2">
      <!-- demo_1 -->
      <div class="demo nested-1" data-id="demo_1" data-minWidth="350" v-if="layoutStore.chartsVisable">
        <div class="handle"></div>
        <ChartList v-if="!chartInitStore.loading" class="container_item">
        </ChartList>
      </div>
      <!-- demo_2 -->
      <div class="demo nested-1" data-id="demo_2" data-minWidth="360" data-initW="424"
        v-if="layoutStore.symbolsVisable">
        <div class="handle"></div>
        <SymbolList class="container_item"></SymbolList>
      </div>
    </div>
    <div class="dragArea_item nested-sortable" data-id="item_2" data-child="demo_3" data-initH="248">
      <!-- demo_3 -->
      <div class="demo nested-2" data-id="demo_3" data-minWidth="445" v-if="layoutStore.orderAreaVisable">
        <div class="handle"></div>
        <OrderArea v-if="!chartInitStore.loading" class="container_item"></OrderArea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLayout } from "@/store/modules/layout";
import { useChartInit } from "@/store/modules/chartInit";

import OrderArea from "../orderArea/index.vue";
import SymbolList from "./SymbolList.vue";
import ChartList from "./ChartList.vue";

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

      .container_item {
        height: 100%;
      }

      .handle {
        height: 40px;
        width: 16px;
        cursor: grab;
        background-image: url("@/assets/icons/icon_drag1.svg");
        background-size: 11px 24px;
        background-repeat: no-repeat;
        background-position: center;
        float: left;
        @include background_color("background");
      }
    }
  }
}
</style>
