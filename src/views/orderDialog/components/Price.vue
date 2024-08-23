<template>
  <div>
    <StepNumInput v-model:value="price" :step="step"></StepNumInput>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { SessionSymbolInfo, Quote } from "#/chart/index";
import { round } from "utils/common/index";

interface Props {
  symbolInfo?: SessionSymbolInfo;
  type: string;
  quote: Quote;
}
const props = defineProps<Props>();

const price = defineModel('value');

// 步长
const step = computed(() => {
  return props.symbolInfo ? 1 / Math.pow(10, props.symbolInfo.digits) : 1;
});

const getLeed = () => {
  if (props.quote && props.symbolInfo) {
    const price = props.type.includes("buy") ? props.quote.ask : props.quote.bid;
    const stopsLevel = props.symbolInfo.stops_level;
    const digits = props.symbolInfo.digits;
    const result_1 = price - (1 / Math.pow(10, digits)) * stopsLevel;
    const result_2 = price + (1 / Math.pow(10, digits)) * stopsLevel;
    return {
      result_1: round(result_1, digits),
      result_2: round(result_2, digits),
    };
  }
};

// 初始化价格
const initPrice = async () => {
  const leed = getLeed();
  const type = props.type;
  if (leed) {
    const { result_1, result_2 } = leed;
    if (type.includes("buy")) {
      price.value = type.includes("Limit") ? result_1 : result_2;
    }
    if (type.includes("sell")) {
      price.value  = type.includes("Limit") ? result_2 : result_1;
    }
  }
};
watch(
  () => [props.symbolInfo, props.type],
  () => {
    if (props.symbolInfo && props.type) {
      initPrice();
    }
  },
  {
    deep: true,
    immediate: true
  }
);
</script>
