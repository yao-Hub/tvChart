<template>
  <el-form-item
    label-position="top"
    :prop="props.formOption.name"
    :label="props.formOption.label"
    :rules="[{ required: true, trigger: ['change', 'blur'] }]"
  >
    <StepNumInput
      v-model:value="price"
      :step="step"
      style="width: 168px"
      :valid="ifError"
      :customSub="initPrice"
      :customAdd="initPrice"
    ></StepNumInput>
    <el-text :type="ifError ? 'danger' : 'info'" class="tip">{{
      range
    }}</el-text>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { SessionSymbolInfo, Quote } from "#/chart/index";
import { round } from "utils/common/index";

interface Props {
  edit?: boolean;
  symbolInfo?: SessionSymbolInfo;
  orderType: string;
  quote?: Quote;
  formOption: {
    name: string;
    label: string;
  };
  breakPrice?: string | number;
}
const props = defineProps<Props>();

const price = defineModel<string | number>("value", { default: "" });

// 步长
const step = computed(() => {
  return props.symbolInfo ? 1 / Math.pow(10, props.symbolInfo.digits) : 1;
});

// 突破价计算
const breakPrice = () => {
  if (props.quote && props.symbolInfo) {
    const type = props.orderType;
    const price = type.includes("buy") ? props.quote.ask : props.quote.bid;
    const stopsLevel = props.symbolInfo.stops_level;
    const digits = props.symbolInfo.digits;
    const buyPrice = price - (1 / Math.pow(10, digits)) * stopsLevel;
    const sellPrice = price + (1 / Math.pow(10, digits)) * stopsLevel;
    return type.includes("buy")
      ? round(buyPrice, digits)
      : round(sellPrice, digits);
  }
  return "";
};

// 限价计算
const limitPrice = () => {
  const breakPrice = props.breakPrice;
  if (props.symbolInfo && breakPrice !== undefined && breakPrice !== "") {
    const type = props.orderType;
    const stopsLevel = props.symbolInfo.stops_level;
    const digits = props.symbolInfo.digits;
    const buyPrice = +breakPrice - (1 / Math.pow(10, digits)) * stopsLevel;
    const sellPrice = +breakPrice + (1 / Math.pow(10, digits)) * stopsLevel;
    return type.includes("buy")
      ? round(buyPrice, digits)
      : round(sellPrice, digits);
  }
  return "";
};

// 初始化价格
const initPrice = () => {
  const name = props.formOption.name;
  if (name === "breakPrice") {
    return breakPrice();
  }
  if (name === "limitedPrice") {
    return limitPrice();
  }
  return false;
};
watch(
  () => [props.symbolInfo, props.orderType],
  () => {
    if (props.symbolInfo && props.orderType && !props.edit) {
      price.value = initPrice() || "";
    }
  },
  {
    deep: true,
    immediate: true,
  }
);
// 限价初始化
watch(
  () => props.breakPrice,
  () => {
    if (props.formOption.name === "limitedPrice" && price.value === "") {
      price.value = limitPrice();
    }
  }
);

const ifError = ref(false);
const range = ref("");
watch(
  () => [props.orderType, props.quote, price.value],
  () => valid(),
  { deep: true }
);

const valid = () => {
  let result = "";
  let vaild = true;
  const name = props.formOption.name;
  const label = props.formOption.label;
  const type = props.orderType.toLocaleLowerCase();
  if (name === "breakPrice") {
    const contrastVal = breakPrice();
    vaild = type.includes("buy")
      ? +price.value >= +contrastVal
      : +price.value <= +contrastVal;
    const size = type.includes("buy") ? "≥" : "≤";
    result = `${label} ${size} ${contrastVal}`;
  }
  if (name === "limitedPrice" && props.breakPrice) {
    const contrastVal = limitPrice();
    vaild = type.includes("buy")
      ? +price.value <= +contrastVal
      : +price.value >= +contrastVal;
    const size = type.includes("buy") ? "≤" : "≥";
    result = `${label} ${size} ${contrastVal}`;
  }
  range.value = result;
  ifError.value = !vaild;
};
</script>

<style lang="scss" scoped>
.tip {
  margin-left: 16px;
}
</style>
