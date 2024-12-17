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
      <span>可用预付款：{{ userStore.margin_free }}</span>
      <span>参考预付款：{{ referMargin }}</span>
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
import { IQuote, ISessionSymbolInfo } from "#/chart/index";
import { useRate } from "@/store/modules/rate";
import { useTheme } from "@/store/modules/theme";
import { useUser } from "@/store/modules/user";
import { round } from "utils/common/index";
import type { CSSProperties } from "vue";
import { computed, reactive, ref, watch } from "vue";

const rateStore = useRate();
const userStore = useUser();
const themeStore = useTheme();
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

// 汇率
const rate = computed(() => {
  const orderType = props.orderType.toLowerCase();
  const symbolInfo = props.symbolInfo;
  let result = 1;
  if (symbolInfo) {
    const rateMap = rateStore.getSymbolRate(symbolInfo.symbol);
    if (orderType === "price") {
      result = rateMap.bid_rate;
    } else {
      result = orderType.includes("buy") ? rateMap.ask_rate : rateMap.bid_rate;
    }
  }
  return result;
});

// 预付款(以买入计算)
// 固定保证金时：referMargin = margin（1手固定的预付款金额） * 需保证金手数
// 固定杠杆时：referMargin = open_price（下单价格） * contract_size （合约数量）/ leverage * 需保证金手数  * 汇率
// open_price（下单价格）： 市价单 = bid，挂单 = 限价[orderPrice]
const referMargin = computed(() => {
  let result;
  const orderType = props.orderType.toLowerCase();
  const symbolInfo = props.symbolInfo;
  const volume = model.value;
  let open_price;
  open_price = orderType === "price" ? props.quote?.bid : props.orderPrice;
  if (symbolInfo && volume) {
    if (open_price) {
      const leverage = symbolInfo.leverage;
      const contract_size = symbolInfo.contract_size;
      const margin = symbolInfo.margin;
      const digits = symbolInfo.digits;
      // 固定保证金时
      result = margin * +volume;
      // 固定杠杆时：
      if (leverage) {
        result =
          ((+open_price * contract_size) / leverage) * +volume * rate.value;
      }
      return round(result, digits);
    }
    return "-";
  }
  return "-";
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

watch(
  () => min.value,
  (value) => {
    model.value = value.toString();
  },
  { deep: true }
);

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
const sliderInput = (percentage: Arrayable<number>) => {
  // 固定杠杆
  // 手数 =（margin_free[可用预付款]*percentage[滑块百分比]）/（(self.bid[市价] * contractSize[合约数量]) / leverage[固定的杠杆倍数]）* 汇率

  // 固定保证金
  // 手数 =（margin_free[可用预付款]*percentage[滑块百分比]）/ margin[ 1手固定的预付款金额]
  if (props.symbolInfo) {
    let result;
    const leverage = props.symbolInfo.leverage;
    const margin_free = +userStore.margin_free;
    const bid = props.quote?.bid;
    const contractSize = props.symbolInfo.contract_size;
    const margin = props.symbolInfo.margin;
    const digits = props.symbolInfo.digits;
    const per = +percentage / 100;
    if (leverage) {
      if (bid) {
        result =
          ((margin_free * per) / ((bid * contractSize) / leverage)) *
          rate.value;
      }
    } else {
      result = (margin_free * per) / margin;
    }
    if (result) {
      model.value = result.toFixed(digits);
    }
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
