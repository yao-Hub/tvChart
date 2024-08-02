<template>
  <a-tooltip title="快捷交易">
    <ThunderboltFilled v-if="orderStore.ifQuick" @click="() => debounceSetQuiTrans(false)" />
    <ThunderboltOutlined v-else @click="() => debounceSetQuiTrans(true)" />
  </a-tooltip>
</template>

<script setup lang="ts">
import { ThunderboltOutlined, ThunderboltFilled } from "@ant-design/icons-vue";
import { debounce } from "lodash";
import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();

const debounceSetQuiTrans = debounce((e: boolean) => {
  if (e) {
    orderStore.addOrderBtn();
  } else {
    orderStore.hideOrderBtn();
  }
}, 200);
</script>

<style lang="scss" scoped>
span {
  cursor: pointer;
}
</style>
