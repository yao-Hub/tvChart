<template>
  <el-form-item
    ref="priceItem"
    label-position="top"
    :prop="props.formOption.name"
    :label="props.formOption.label"
    :rules="[
      { required: true, trigger: ['change', 'blur'], validator: validator },
    ]"
  >
    <StepNumInput v-model:value="price" :step="step"></StepNumInput>
  </el-form-item>
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

const priceItem = ref();

watch(
  () => props.quote,
  () => {
    if (priceItem.value) {
      if (price.value) {
        priceItem.value.validate();
      } else {
        priceItem.value.clearValidate();
      }
    }
  }
);
// 步长
const step = computed(() => {
  return props.symbolInfo ? props.symbolInfo.volume_step / 100 : 1;
});

const getLeed = () => {
  if (props.quote && props.symbolInfo) {
    const price = props.orderType.includes("buy")
      ? props.quote.ask
      : props.quote.bid;
    const stopsLevel = props.symbolInfo.stops_level;
    const digits = props.symbolInfo.digits;
    const result_1 = price - stopsLevel / Math.pow(10, digits);
    const result_2 = price + stopsLevel / Math.pow(10, digits);
    return {
      result_1: round(result_1, digits),
      result_2: round(result_2, digits),
    };
  }
};

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
const validator = (rule: any, value: any, callback: any) => {
  const type = props.orderType.toLocaleLowerCase();
  if ([undefined, ""].includes(price.value)) {
    return callback(new Error(`请输入${props.formOption.label}`));
  }
  let size = "";
  let val: string | number = "";
  let result = false;
  const leed = getLeed();
  if (leed) {
    const { result_1, result_2 } = leed;
    if (type.includes("buy")) {
      if (["buyLimit", "sellLimit"].includes(props.orderType)) {
        result = +price.value <= +result_1;
        size = "≤";
        val = result_1;
      } else {
        result = +price.value >= +result_2;
        size = "≥";
        val = result_2;
      }
    }
    if (type.includes("sell")) {
      if (["buyLimit", "sellLimit"].includes(props.orderType)) {
        result = +price.value >= +result_2;
        size = "≥";
        val = result_2;
      } else {
        result = +price.value <= +result_1;
        size = "≤";
        val = result_1;
      }
    }
  }
  if (!result) {
    return callback(new Error(`${props.formOption.label}需${size}${val}`));
  }
  callback();
};
</script>
