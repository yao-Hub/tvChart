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
  breakPrice?: string;
}
const props = defineProps<Props>();

const price = defineModel<string | number>("value", { default: "" });

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
    const result_1 = +price - stopsLevel / Math.pow(10, digits);
    const result_2 = +price + stopsLevel / Math.pow(10, digits);
    return {
      result_1: round(result_1, digits),
      result_2: round(result_2, digits),
    };
  }
};

// 初始化价格
const initPrice = () => {
  const orderType = props.orderType.toLowerCase();
  const leed = getLeed();
  let result = "";
  if (leed) {
    const { result_1, result_2 } = leed;
    if (orderType.includes("buy")) {
      result = orderType.includes("limit") ? result_1 : result_2;
    }
    if (orderType.includes("sell")) {
      result = orderType.includes("limit") ? result_2 : result_1;
    }
  }
  return result;
};
watch(
  () => [props.symbolInfo, props.orderType, props.edit],
  () => {
    if (props.symbolInfo && props.orderType && !props.edit) {
      price.value = initPrice();
    }
  },
  {
    deep: true,
    immediate: true,
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
  let size = "";
  let val: string | number = "";
  let valid = true;
  const leed = getLeed();
  const type = props.orderType.toLowerCase();
  const value = price.value;
  if (leed) {
    const { result_1, result_2 } = leed;
    if (type.includes("buy")) {
      if (["buylimit", "selllimit"].includes(type)) {
        value && (valid = +value <= +result_1);
        size = "≤";
        val = result_1;
      } else {
        value && (valid = +value >= +result_1);
        size = "≥";
        val = result_2;
      }
    }
    if (type.includes("sell")) {
      if (["buylimit", "selllimit"].includes(type)) {
        value && (valid = +value >= +result_1);
        size = "≥";
        val = result_2;
      } else {
        value && (valid = +value <= +result_1);
        size = "≤";
        val = result_1;
      }
    }
  }
  range.value = `${props.formOption.label}${size}${val}`;
  ifError.value = !valid;
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.tip {
  @include font_color("word-gray");
  margin-left: 16px;
}
</style>
