<template>
  <a-tooltip title="快捷交易">
    <ThunderboltFilled
      class="checked"
      v-if="orderStore.ifQuick"
      @click="() => handleClick(false)"
    />
    <ThunderboltOutlined v-else @click="() => handleClick(true)" />
  </a-tooltip>
</template>

<script setup lang="ts">
import { ThunderboltOutlined, ThunderboltFilled } from "@ant-design/icons-vue";
import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();

const handleClick = (e: boolean) => {
  orderStore.ifQuick = e;
  window.localStorage.setItem("ifQuick", JSON.stringify(e));
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

span {
  cursor: pointer;
}
.checked {
  @include font_color('primary');
}
</style>
