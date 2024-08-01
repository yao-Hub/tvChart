<template>
  <div class="dragArea">
    <div class="dragArea_item">
      <div class="demo" v-if="layoutStore.chartsVisable">
        <HolderOutlined class="handle" />
        <ChartList
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
        <OrderArea class="container_item"></OrderArea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HolderOutlined } from "@ant-design/icons-vue";

import { useLayout } from "@/store/modules/layout";
import { useChartSub } from "@/store/modules/chartSub";

import OrderArea from "../orderArea/index.vue";
import SymbolList from "./components/SymbolList.vue";
import ChartList from "./components/ChartList.vue";

const chartSubStore = useChartSub();
const layoutStore = useLayout();
</script>

<style lang="scss" scoped>
.dragArea {
  height: calc(100vh - 30px - 50px);
  width: 100%;
  box-sizing: border-box;
  position: relative;

  .dragArea_item {
    width: 100%;
    box-sizing: border-box;
    position: relative;
    // background: red;

    .demo {
      box-sizing: border-box;
      position: absolute;
      user-select: none;
      overflow: auto;
      // border: 1px solid red;
      background: #525252;

      .container_item {
        height: 100%;
        width: 100%;
      }

      .handle {
        position: absolute;
        top: 10px;
        left: 5px;
        z-index: 2;
        cursor: grab;
      }
    }
  }
}
</style>
