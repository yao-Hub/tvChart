<template>
  <el-form-item
    label-position="top"
    :prop="props.formOption.name"
    :label="props.formOption.label"
  >
    <StepNumInput
      v-model:value="model"
      :step="step"
      :min="min"
      :max="max"
      :disabled="disabled"
      @blur="checkVolume"
      @sub="percentage = 0"
      @plus="percentage = 0"
      @input="percentage = 0"
      style="width: 168px"
    ></StepNumInput>
    <div class="tips">
      <span>{{ $t("order.marginFree") }}：{{ userStore.margin_free }}</span>
      <span>{{ $t("order.referencePrepayment") }}：{{ referMargin }}</span>
    </div>
    <el-slider
      v-if="!disabled"
      v-model="percentage"
      :marks="marks"
      :max="20"
      :format-tooltip="formatTooltip"
      style="width: 145px; margin-left: 10px; margin-bottom: 20px"
      @input="sliderInput"
    />
  </el-form-item>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";

import { IQuote, ISessionSymbolInfo } from "#/chart/index";

import { useOrder } from "@/store/modules/order";
import { useQuotes } from "@/store/modules/quotes";
import { useTheme } from "@/store/modules/theme";
import { useUser } from "@/store/modules/user";
import { round } from "@/utils/common";

const quotesStore = useQuotes();
const userStore = useUser();
const themeStore = useTheme();
const orderStore = useOrder();

type Arrayable<T> = T | T[];
interface Props {
  disabled?: boolean;
  symbolInfo?: ISessionSymbolInfo;
  quote?: IQuote;
  formOption: {
    name: string;
    label: string;
  };
  orderType: string;
  orderPrice: string | number;
}
const props = defineProps<Props>();
const model = defineModel<string | number>("volume", { default: "" });

// 步长
const step = computed(() => {
  return props.symbolInfo ? props.symbolInfo.volume_step / 100 : 1;
});

// 单笔最小手数(volume_step/100)
const min = computed(() => {
  const symbolInfo = props.symbolInfo;
  if (symbolInfo) {
    const volume_min = symbolInfo.volume_step / 100;
    return volume_min;
  }
  return 0;
});

// 单笔最大手数
const max = computed(() => {
  const symbolInfo = props.symbolInfo;
  if (symbolInfo) {
    const volume_max = symbolInfo.volume_max / 100;
    return volume_max;
  }
  return 0;
});

// 预付款
const referMargin = computed(() => {
  const symbolInfo = props.symbolInfo;
  if (symbolInfo) {
    const symbol = symbolInfo.symbol;
    const currentQuote = quotesStore.qoutes[symbol];
    const direction = props.orderType.includes("sell") ? "sell" : "buy";
    const bulidPrice =
      direction === "sell" ? currentQuote.bid : currentQuote.ask;
    const volume = model.value;
    const referMargin = orderStore.getReferMargin(
      {
        symbol,
        volume,
        bulidPrice,
      },
      direction
    );
    return referMargin === "-" ? "-" : round(referMargin, symbolInfo.digits);
  }
  return "-";
});

onMounted(() => {
  if (model.value === "") {
    model.value = min.value;
  }
});
onUnmounted(() => {
  model.value = "";
});

const checkVolume = () => {
  const value = model.value;
  if (!value || Number(value) < min.value) {
    model.value = min.value.toString();
  }
  if (value && Number(value) > max.value) {
    model.value = max.value.toString();
  }
};

// 进度条
const percentage = ref<number>(0);
// 底部数字样式
const numStyle = (num: number) => {
  const nowPercent = percentage.value;
  const activedColor = themeStore.systemTheme === "light" ? "#000" : "#fff";
  const nomalColor = themeStore.systemTheme === "light" ? "#CECDD1" : "#56585C";
  return {
    style: {
      color: num === nowPercent ? activedColor : nomalColor,
      fontSize: "12px",
    },
    label: `${num}%`,
  };
};
interface Mark {
  style: CSSProperties;
  label: string;
}
type Marks = Record<number, Mark | string>;
const marks = reactive<Marks>({
  0: "0%",
  5: "5%",
  10: "10%",
  15: "15%",
  20: "20%",
});
const formatTooltip = (value: number) => {
  return `${value}%`;
};
// 更改底部数字样式和手数
watch(
  () => percentage.value,
  (value) => {
    const keys = Object.keys(marks).map((key) => Number(key));
    if (keys.includes(value)) {
      for (const i in marks) {
        marks[i] = numStyle(+i);
      }
    }
  },
  { deep: true, immediate: true }
);
// 滑块手数：可用预付款最大的可交易手数*百分比
const sliderInput = (percentage: Arrayable<number>) => {
  if (props.symbolInfo) {
    const { margin, digits } = props.symbolInfo;
    const volumeMax = +userStore.margin_free / margin;
    const prec = +percentage / 100;
    model.value = round(volumeMax * prec, digits);
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.tips {
  margin-left: 16px;
  @include font_color("word-gray");
  display: flex;
  flex-direction: column;
  height: 40px;
  justify-content: space-between;
  line-height: normal;
}
</style>
