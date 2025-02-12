<template>
  <el-form-item
    label-position="top"
    :prop="props.formOption.name"
    :label="props.formOption.label"
  >
    <StepNumInput
      v-model:value="model"
      :min="step"
      :disabled="disabled"
      :customSub="customSub"
      :customAdd="customAdd"
      @sub="percentage = 0"
      @plus="percentage = 0"
      @input="handleInput"
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
      placement="right"
      style="width: 145px; margin-left: 10px; margin-bottom: 20px"
      @input="sliderInput"
    />
  </el-form-item>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, onUnmounted, reactive, ref, watch } from "vue";

import { IQuote, ISessionSymbolInfo } from "#/chart/index";

import { useOrder } from "@/store/modules/order";
import { useQuotes } from "@/store/modules/quotes";
import { useRate } from "@/store/modules/rate";
import { useTheme } from "@/store/modules/theme";
import { useUser } from "@/store/modules/user";

import { limitdigit, round } from "@/utils/common";
import { isNil } from "lodash";

const quotesStore = useQuotes();
const userStore = useUser();
const themeStore = useTheme();
const orderStore = useOrder();
const rateStore = useRate();

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

// 步长 (单笔最小手数)
const step = computed(() => {
  return props.symbolInfo ? props.symbolInfo.volume_step / 100 : 1;
});

const customSub = () => {
  const result = orderStore.volumeSub(+model.value, step.value, step.value);
  return round(result, 2);
};
const customAdd = () => {
  const result = orderStore.volumeAdd(+model.value, step.value);
  return round(result, 2);
};

// 预付款
const referMargin = computed(() => {
  const symbolInfo = props.symbolInfo;
  if (symbolInfo) {
    const symbol = symbolInfo.symbol;
    const currentQuote = quotesStore.qoutes[symbol];
    const direction = props.orderType.includes("buy") ? "buy" : "sell";
    const bulidPrice =
      direction === "sell" ? currentQuote.bid : currentQuote.ask;
    const volume = model.value;
    const referMargin = orderStore.getReferMargin({
      symbol,
      volume,
      bulidPrice,
    });
    return referMargin === "-" ? "-" : round(referMargin, 2);
  }
  return "-";
});

watch(
  () => props.symbolInfo?.symbol,
  (val) => {
    if (val && !props.disabled) {
      model.value = step.value;
    }
  },
  { deep: true, immediate: true }
);

onUnmounted(() => {
  model.value = "";
});

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
// 滑块百分比计算手数
const sliderInput = (percentage: Arrayable<number>) => {
  if (props.symbolInfo) {
    const ratio = +percentage / 100;
    const { margin, leverage, contract_size, pre_currency, currency, symbol } =
      props.symbolInfo;
    let volume = 0;
    const ratioMargin = +userStore.margin_free * ratio;
    // 固定杠杆时
    if (leverage) {
      // 每手预付款
      let singleMargin = contract_size / leverage;

      const openPrice =
        props.orderType === "price" ? props.quote?.bid : props.orderPrice;
      const loginInfo = userStore.state.loginInfo;
      const userCur = loginInfo?.currency;
      if (!isNil(openPrice)) {
        // 汇率转化
        if (userCur !== pre_currency && userCur === currency) {
          singleMargin = singleMargin * +openPrice;
        } else {
          const rate = rateStore.getRate(symbol).pre_user.bid_rate;
          singleMargin = singleMargin * rate;
        }
        volume = ratioMargin / singleMargin;
      }
    } else {
      // 固定保证金
      volume = ratioMargin / margin;
    }
    // 需满足是step的倍数
    let remainder = volume % step.value;
    if (remainder !== 0) {
      volume -= remainder;
    }
    model.value = round(volume, 2);
  }
};

const handleInput = (value: string | number) => {
  model.value = limitdigit(value, 2);
  percentage.value = 0;
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
  span {
    font-size: var(--tip-size);
  }
}
</style>
