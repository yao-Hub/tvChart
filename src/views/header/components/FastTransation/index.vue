<!-- 快捷交易 -->
<template>
  <ThunderboltFilled
    class="icon checked"
    v-if="orderStore.ifQuick"
    @click="() => handleClick(false)"
  />
  <ThunderboltOutlined class="icon" v-else @click="() => handleClick(true)" />
</template>

<script setup lang="ts">
import { ThunderboltOutlined, ThunderboltFilled } from "@ant-design/icons-vue";
import { useOrder } from "@/store/modules/order";
import { useChartAction } from "@/store/modules/chartAction";
const chartActionStore = useChartAction();

const orderStore = useOrder();

const handleClick = (e: boolean) => {
  orderStore.ifQuick = e;
  window.localStorage.setItem("ifQuick", JSON.stringify(e));
  chartActionStore.toggleOrderBtn(e);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.checked {
  @include font_color("primary");
}
.icon {
  font-size: var(--font-size);
  cursor: pointer;
  color: #333333;
  margin-top: 2px;
}
</style>
