<!-- 快捷交易 -->
<template>
  <el-tooltip content="快捷交易">
    <div
      class="iconbox"
      :class="{ iconActive: orderStore.ifQuick }"
      @click="handleClick"
    ></div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useChartAction } from "@/store/modules/chartAction";
import { useOrder } from "@/store/modules/order";
import { useStorage } from "@/store/modules/storage";
const storageStore = useStorage();

const chartActionStore = useChartAction();

const orderStore = useOrder();

const handleClick = () => {
  orderStore.ifQuick = !orderStore.ifQuick;
  storageStore.setItem("ifQuick", orderStore.ifQuick);
  chartActionStore.toggleOrderBtn(orderStore.ifQuick);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.iconbox {
  background-image: url("@/assets/icons/light/icon_3.svg");
  &:hover {
    @include background_color("background-hover");
  }
}
.iconActive {
  background-image: url("@/assets/icons/light/icon_3a.svg");
}
</style>
