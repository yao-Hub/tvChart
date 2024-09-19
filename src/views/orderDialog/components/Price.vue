<template>
  <a-form-item
    :name="props.formOption.name"
    :label="props.formOption.label"
    :rules="[
      { required: true, trigger: ['change', 'blur'], validator: validator },
    ]"
    validateFirst
    :help="help"
    :validate-status="help ? 'error' : ''"
  >
    <StepNumInput v-model:value="price" :step="step"></StepNumInput>
  </a-form-item>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
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
  breakPrice?: string;
}
const props = defineProps<Props>();

const price = defineModel<string>("value", { default: "" });

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

// 限价计算
const limitPrice = () => {
  if (
    props.symbolInfo &&
    props.breakPrice !== undefined &&
    props.breakPrice !== ""
  ) {
    const stopsLevel = props.symbolInfo.stops_level;
    const digits = props.symbolInfo.digits;
    const result_1 =
      +props.breakPrice - (1 / Math.pow(10, digits)) * stopsLevel;
    const result_2 =
      +props.breakPrice + (1 / Math.pow(10, digits)) * stopsLevel;
    return {
      result_1: round(result_1, digits),
      result_2: round(result_2, digits),
    };
  }
};
// 限价初始化价格
watch(
  () => props.breakPrice,
  (val) => {
    if (
      ![undefined, ""].includes(val) &&
      props.formOption.name === "limitedPrice" &&
      price.value === ""
    ) {
      const limit = limitPrice();
      if (limit) {
        const { result_1, result_2 } = limit;
        price.value = props.orderType.includes("buy")
          ? String(result_1)
          : String(result_2);
      }
    }
  }
);

// 初始化价格
const initPrice = async () => {
  const orderType = props.orderType;
  const leed = getLeed();
  if (leed) {
    const { result_1, result_2 } = leed;
    if (orderType.includes("buy")) {
      price.value = orderType.includes("Limit")
        ? String(result_1)
        : String(result_2);
    }
    if (orderType.includes("sell")) {
      price.value = orderType.includes("Limit")
        ? String(result_2)
        : String(result_1);
    }
  }
};
watch(
  () => [props.symbolInfo, props.orderType],
  () => {
    if (
      props.symbolInfo &&
      props.orderType &&
      props.formOption.name !== "limitedPrice"
    ) {
      initPrice();
    }
  },
  {
    deep: true,
    immediate: true,
  }
);

const help = ref("");
watch(
  () => [price.value, props.quote],
  () => {
    const name = props.formOption.name;
    if (!["limitedPrice", "breakPrice"].includes(name)) {
      help.value = "";
      return;
    }
    let size = "";
    let value: string | number = "";
    let result = false;
    const type = props.orderType.toLocaleLowerCase();
    if (name === "limitedPrice") {
      const limit = limitPrice();
      if (limit) {
        const { result_1, result_2 } = limit;
        value = type.includes("buy") ? result_1 : result_2;
        result = type.includes("buy") ? +price.value <= +result_1 : +price.value >= +result_2;
        size = type.includes("buy") ? "≤" : "≥";
      }
    }
    if (name === "breakPrice") {
      const leed = getLeed();
      if (leed) {
        const { result_1, result_2 } = leed;
        if (type.includes("buy")) {
          result = +price.value >= +result_2;
          size = "≥";
          value = result_2; 
        }
        if (type.includes("sell")) {
          result = +price.value <= +result_1;
          size = "≤";
          value = result_1;
        }
      }
    }
    if (!result) {
      help.value = `${props.formOption.label}需${size}${value}`;
      return;
    }
    help.value = "";
  },
  {
    deep: true
  }
)

// 检查价格是否合法
const validator = () => {
  const type = props.orderType.toLocaleLowerCase();
  if ([undefined, ""].includes(price.value)) {
    return Promise.reject(`请输入${props.formOption.label}`);
  }
  let size = "";
  let value: string | number = "";
  let result = false;
  if (["limitedPrice", "breakPrice"].includes(props.formOption.name)) {
    return Promise.resolve();
  }
  const leed = getLeed();
  if (leed) {
    const { result_1, result_2 } = leed;
    if (type.includes("buy")) {
      if (["buyLimit", "sellLimit"].includes(props.orderType)) {
        result = +price.value <= +result_1;
        size = "≤";
        value = result_1;
      } else {
        result = +price.value >= +result_2;
        size = "≥";
        value = result_2;
      }
    }
    if (type.includes("sell")) {
      if (["buyLimit", "sellLimit"].includes(props.orderType)) {
        result = +price.value >= +result_2;
        size = "≥";
        value = result_2;
      } else {
        result = +price.value <= +result_1;
        size = "≤";
        value = result_1;
      }
    }
  }
  if (!result) {
    return Promise.reject(`${props.formOption.label}需${size}${value}`);
  }
  return Promise.resolve();
};
</script>
