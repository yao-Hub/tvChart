<template>
  <div style="display: flex; gap: 5px; align-items: center">
    <span style="min-width: 50px">{{ bid }}</span>
    <span>sell</span>
    <div
      style="
        display: flex;
        align-items: center;
        border: 1px solid #525252;
        padding: 0 5px;
      "
    >
      <UpOutlined style="font-size: 12px; cursor: pointer" />
      <input type="text" style="width: 50px; border: none" />
      <DownOutlined style="font-size: 12px; cursor: pointer" />
    </div>
    <span>buy</span>
    <span style="min-width: 50px">{{ ask }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { UpOutlined, DownOutlined } from "@ant-design/icons-vue";

import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();

interface Props {
  symbol: string;
}
const props = defineProps<Props>();

const bid = computed(() => {
  return getQuotes("bid", props.symbol);
});

const ask = computed(() => {
  return getQuotes("ask", props.symbol);
});

const getQuotes = (type: "bid" | "ask", symbol: string) => {
  if (orderStore.currentQuotes[symbol]) {
    return orderStore.currentQuotes[symbol][type];
  }
  return "-";
};
</script>
