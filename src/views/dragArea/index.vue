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
        <div class="handle">
          <BaseImg iconName="icon_drag1"></BaseImg>
        </div>
        <ChartList v-if="!chartInitStore.state.loading" class="container_item">
        </ChartList>
      </div>
      <!-- demo_2 -->
      <div
        class="demo nested-1"
        data-id="demo_2"
        data-minWidth="360"
        data-initW="600"
        v-if="layoutStore.symbolsVisable"
      >
        <div class="handle">
          <BaseImg iconName="icon_drag1"></BaseImg>
        </div>

        <SymbolList class="container_item"></SymbolList>
      </div>
    </div>
    <div
      class="dragArea_item nested-sortable"
      data-id="item_2"
      data-child="demo_3"
      data-initH="322"
    >
      <!-- demo_3 -->
      <div
        class="demo nested-1"
        data-id="demo_3"
        data-minWidth="445"
        v-if="layoutStore.orderAreaVisable"
      >
        <div class="handle">
          <BaseImg iconName="icon_drag1"></BaseImg>
        </div>
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
  // - 底部 - 头部
  height: calc(100vh - 40px - 48px);
  width: 100%;
  position: relative;
  overflow: hidden;
  @include background_color("background");

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
        height: var(--base-height);
        width: 16px;
        cursor: grab;
        float: left;
        position: relative;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        .icon_drag1 {
          height: 22px;
          width: 11px;
        }
      }
    }
  }
}
</style>
