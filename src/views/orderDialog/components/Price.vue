<template>
  <a-form-item
    :name="props.formOption.name"
    :label="props.formOption.label"
    :rules="[
      { required: true, trigger: ['change', 'blur'], validator: validator },
    ]"
    validateFirst
  >
    <StepNumInput v-model:value="price" :step="step"></StepNumInput>
  </a-form-item>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { SessionSymbolInfo, Quote } from "#/chart/index";
import { round } from "utils/common/index";

interface Props {
  symbolInfo?: SessionSymbolInfo;
  orderType: string;
  quote: Quote;
  formOption: {
    name: string;
    label: string;
  };
}
const props = defineProps<Props>();

const price = defineModel<string>("value", {default: ""});

// 步长
const step = computed(() => {
  return props.symbolInfo ? 1 / Math.pow(10, props.symbolInfo.digits) : 1;
});

const getLeed = () => {
  if (props.quote && props.symbolInfo) {
    const price = props.orderType.includes("buy")
      ? props.quote.ask
      : props.quote.bid;
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
  const orderType = props.orderType;
  if (leed) {
    const { result_1, result_2 } = leed;
    if (orderType.includes("buy")) {
      price.value = orderType.includes("Limit") ? String(result_1) : String(result_2);
    }
    if (orderType.includes("sell")) {
      price.value = orderType.includes("Limit") ? String(result_2) : String(result_1);
    }
  }
};
watch(
  () => [props.symbolInfo, props.orderType],
  () => {
    if (props.symbolInfo && props.orderType) {
      initPrice();
    }
  },
  {
    deep: true,
    immediate: true,
  }
);

// 检查价格是否合法
const validator = () => {
  const type = props.orderType.toLocaleLowerCase();
  if ([undefined, ""].includes(price.value)) {
    return Promise.reject(`请输入${props.formOption.label}`);
  }
  const leed = getLeed();
  if (leed) {
    const { result_1, result_2 } = leed;
    let size = "";
    let value: string | number = "";
    let result = false;
    if (type.includes("buy")) {
      if (['buyLimit', 'sellLimit'].includes(props.orderType)) {
        result = +price.value <= result_1;
        size = "≤";
        value = result_1;
      } else if (props.orderType === "limitedPrice") {
        result = +price.value <= result_2;
        size = "≤";
        value = result_2;
      } else {
        result = +price.value >= result_2;
        size = "≥";
        value = result_2;
      }
    }
    if (type.includes("sell")) {
      if (['buyLimit', 'sellLimit'].includes(props.orderType)) {
        result = +price.value >= result_2;
        size = "≥";
        value = result_2;
      } else if (props.orderType === "limitedPrice") {
        result = +price.value >= result_1;
        size = "≥";
        value = result_1;
      } else {
        result = +price.value <= result_1;
        size = "≤";
        value = result_1;
      }
    }
    if (result) {
      return Promise.resolve();
    } else {
      return Promise.reject(`${props.formOption.label}需${size}${value}`);
    }
  }
  return Promise.resolve();
};
</script>
