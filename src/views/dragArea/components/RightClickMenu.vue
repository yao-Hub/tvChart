<template>
  <div
    class="rightClickMenu"
    v-show="model"
    :style="{ top: `${top}px`, left: `${left}px` }"
  >
    <div class="item" @click="addOrder">新订单</div>
    <div class="item" @click="addChart">新图表</div>
    <div class="item" @click="symbolDetail">品种信息</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useOrder } from "@/store/modules/order";
import { useChartInit } from "@/store/modules/chartInit";
const chartInitStore = useChartInit();
const orderStore = useOrder();

interface Props {
  pos: {
    top: number;
    left: number;
  };
  symbol: string;
}
const props = defineProps<Props>();
const model = defineModel<boolean>("visible", {
  required: true,
  default: false,
});

const left = computed(() => {
  const iw = window.innerWidth;
  const symbolList = document.querySelector(".symbolList");
  if (symbolList) {
    const { left } = symbolList.getBoundingClientRect();
    // 判断是否超出了屏幕边界
    const peakRight = left + props.pos.left + 120;
    if (iw < peakRight) {
      return props.pos.left - 120;
    }
  }
  return props.pos.left;
});

const top = computed(() => {
  const ih = window.innerHeight;
  const symbolList = document.querySelector(".symbolList");
  if (symbolList) {
    const { top } = symbolList.getBoundingClientRect();
    const peakBottom = top + props.pos.top + 20 * 3;
    if (ih < peakBottom) {
      return props.pos.top - 20 * 3;
    }
  }
  return props.pos.top;
});

const addOrder = () => {
  orderStore.currentSymbol = props.symbol;
  orderStore.createOrder();
  model.value = false;
};
const addChart = () => {
  chartInitStore.addChart(props.symbol);
  model.value = false;
};
const symbolDetail = () => {
  alert("开发中");
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.rightClickMenu {
  position: absolute;
  z-index: 2;
  border-radius: 4px;
  border: 1px solid #dee2e9;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  @include background_color("background-dialog");
  .item {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 10px 0px 10px 16px;
    width: 120px;
    height: var(--size);
    box-sizing: border-box;
    &:hover {
      @include background_color("background-hover");
    }
  }
}
</style>
