<!-- 普通挂单的价格计算 -->
<template>
  <el-form-item
    label-position="top"
    :prop="props.formOption.name"
    :label="props.formOption.label"
    :rules="[{ required: true, trigger: ['change', 'blur'] }]"
  >
    <div style="width: 100%; display: flex; gap: 16px">
      <StepNumInput
        :disabled="disabled"
        v-model:value="price"
        :step="step"
        style="width: 168px"
        :valid="ifError"
        :customSub="customCalc"
        :customAdd="customCalc"
        @input="handleInput"
      ></StepNumInput>
      <el-text :type="ifError ? 'danger' : 'info'">{{ range }}</el-text>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { IQuote, ISessionSymbolInfo } from "#/chart/index";
import { limitdigit, round } from "utils/common/index";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

interface Props {
  disabled?: boolean;
  symbolInfo?: ISessionSymbolInfo;
  orderType: string;
  quote?: IQuote;
  formOption: {
    name: string;
    label: string;
  };
}
const props = defineProps<Props>();

const price = defineModel<string | number>("value", { default: "" });

const ifError = ref(false);
const range = ref("");

// 步长
const step = computed(() => {
  return props.symbolInfo ? 50 / Math.pow(10, props.symbolInfo.digits) : 0.5;
});

const getRange = (type: string) => {
  let result = {
    max: "",
    min: "",
  };
  try {
    if (props.symbolInfo) {
      const ask = props.quote?.ask;
      const bid = props.quote?.bid;
      const { digits, stops_level } = props.symbolInfo;
      // 距离
      const distance = stops_level / Math.pow(10, digits);
      switch (type) {
        case "buyLimit":
          if (ask) {
            result.max = round(ask - distance, digits);
          }
          break;
        case "sellLimit":
          if (bid) {
            result.min = round(bid + distance, digits);
          }
          break;
        case "buyStop":
          if (ask) {
            result.min = round(ask + distance, digits);
          }
          break;
        case "sellStop":
          if (bid) {
            result.max = round(bid - distance, digits);
          }
          break;
        case "buyStopLimit":
          if (ask) {
            result.min = round(ask + distance, digits);
          }
          break;
        case "sellStopLimit":
          if (bid) {
            result.max = round(bid - distance, digits);
          }
          break;
        default:
          break;
      }
    }
    return result;
  } catch (error) {
    return result;
  }
};

const setRange = () => {
  const { max, min } = getRange(props.orderType);
  if (max) {
    range.value = `≤ ${max}`;
  }
  if (min) {
    range.value = `≥ ${min}`;
  }
};

// 初始化价格
const initPrice = () => {
  if (price.value === "") {
    const { max, min } = getRange(props.orderType);
    price.value = max || min || step.value;
  }
};

const customCalc = () => {
  if (price.value === "") {
    const { max, min } = getRange(props.orderType);
    return max || min || step.value;
  }
};

watch(
  () => [props.symbolInfo, props.orderType, props.quote],
  () => {
    setRange();
  },
  { deep: true }
);

// 校验
watch(
  () => [range.value, price.value],
  () => {
    if (price.value) {
      const { max, min } = getRange(props.orderType);
      if (max && +price.value > +max) {
        ifError.value = true;
      } else if (min && +price.value < +min) {
        ifError.value = true;
      } else {
        ifError.value = false;
      }
    } else {
      ifError.value = false;
    }
  }
);

onMounted(() => {
  initPrice();
  setRange();
});

onUnmounted(() => {
  price.value = "";
});

const handleInput = (value: string | number) => {
  if (props.symbolInfo) {
    const { digits } = props.symbolInfo;
    price.value = limitdigit(value, digits);
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
</style>
