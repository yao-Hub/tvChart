<!-- 特殊挂单的价格计算 6,7 -->
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
        :customSub="initPrice"
        :customAdd="initPrice"
        @input="handleInput"
      ></StepNumInput>
      <el-text :type="ifError ? 'danger' : 'info'">{{ range }}</el-text>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { ISessionSymbolInfo } from "#/chart/index";
import { limitdigit, round } from "utils/common/index";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

interface Props {
  disabled?: boolean;
  symbolInfo?: ISessionSymbolInfo;
  orderType: string;
  formOption: {
    name: string;
    label: string;
  };
  orderPrice: string | number;
}
const props = defineProps<Props>();

const price = defineModel<string | number>("value", { default: "" });

// 步长
const step = computed(() => {
  return props.symbolInfo ? 1 / Math.pow(10, props.symbolInfo.digits) : 1;
});

const ifError = ref(false);
const range = ref("");

const getRange = (type: string) => {
  let result = {
    max: "",
    min: "",
  };
  try {
    if (props.symbolInfo && props.orderPrice) {
      const { digits, stops_level } = props.symbolInfo;
      const distance = stops_level / Math.pow(10, digits);
      switch (type) {
        case "buyStopLimit":
          result.max = round(+props.orderPrice - distance, digits);
          break;
        case "sellStopLimit":
          result.min = round(+props.orderPrice + distance, digits);
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
    range.value = `<= ${max}`;
  }
  if (min) {
    range.value = `>= ${min}`;
  }
};

watch(
  () => [props.symbolInfo, props.orderType, props.orderPrice],
  () => {
    setRange();
  },
  { deep: true }
);

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

// 初始化价格
const initPrice = () => {
  if (price.value === "") {
    const { max, min } = getRange(props.orderType);
    price.value = max || min || step.value;
  }
};

onMounted(() => {
  initPrice();
  setRange();
});

onUnmounted(() => {
  price.value = "";
});

const handleInput = (value: string | number) => {
  price.value = limitdigit(value, 2);
};
</script>

<style lang="scss" scoped>
.tip {
  margin-left: 16px;
  display: block;
  width: 200px;
}
</style>
