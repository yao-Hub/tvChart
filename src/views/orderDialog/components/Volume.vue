<template>
  <StepNumInput
    v-model:value="model"
    :step="step"
    :min="min"
    :max="max"
  ></StepNumInput>
  <a-form-item no-style>
    <span class="tip">参考预付款：{{ Margin }}</span>
  </a-form-item>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { SessionSymbolInfo, Quote } from "#/chart/index";
import Decimal from "decimal.js";

interface Props {
  symbolInfo?: SessionSymbolInfo;
  quote: Quote;
}
const props = defineProps<Props>();
const model = defineModel<string>("volume");

// 步长
const step = computed(() => {
  return props.symbolInfo ? props.symbolInfo.volume_step : 1;
});

// 单笔最小手数
const min = computed(() => {
  const symbol = props.symbolInfo;
  if (symbol) {
    const volume_min = symbol.volume_min / 100;
    return volume_min;
  }
  return 0;
});

// 单笔最大手数
const max = computed(() => {
  const symbol = props.symbolInfo;
  if (symbol) {
    const volume_max = symbol.volume_max / 100;
    return volume_max;
  }
  return 0;
});

// 预付款(以买入计算)
const Margin = computed(() => {
  let result = 0;
  const symbol = props.symbolInfo;
  if (symbol) {
    const margin = new Decimal(symbol.margin);
    const ask = new Decimal(props.quote.ask);
    const contractSize = new Decimal(symbol.contract_size);
    const volumeValue = new Decimal(model.value || 0);
    if (symbol.leverage) {
      const leverage = new Decimal(symbol.leverage);
      result = ask
        .times(contractSize)
        .div(leverage)
        .times(volumeValue)
        .toNumber();
    } else {
      result = margin.times(volumeValue).toNumber();
    }
    return result;
  }
});

// 填充最小值 确定作用域
watch(
  () => [min.value, max.value, model.value],
  () => {
    if (!props.symbolInfo) {
      return;
    }
    const num = model.value;
    if (!num || Number(num) < min.value) {
      model.value = min.value.toString();
    }
    if (num && Number(num) > max.value) {
      model.value = max.value.toString();
    }
  },
  { immediate: true, deep: true }
);
</script>

<style lang="scss" scoped></style>
