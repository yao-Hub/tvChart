<template>
  <el-form-item
    label-position="top"
    :prop="props.type"
    :label="titleMap[props.type]"
  >
    <StepNumInput
      v-model:value="price"
      :customSub="initPrice"
      :customAdd="initPrice"
    ></StepNumInput>
    <el-form-item>
      <el-text type="danger" v-if="rangeTip">{{ rangeTip }}</el-text>
      <span class="tip" v-if="props.symbolInfo && price === ''"
        >至少远离市价{{ minDisPoint }}点</span
      >
      <span class="tip" v-if="props.symbolInfo && price !== '' && !rangeTip"
        >预计{{ $t(`order.${props.type}`) }}: {{ profit }}</span
      >
    </el-form-item>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { SessionSymbolInfo, Quote } from "#/chart/index";
import { round } from "utils/common/index";

const titleMap = {
  stopLoss: "止损",
  stopProfit: "止盈",
};
interface Props {
  type: "stopLoss" | "stopProfit";
  symbolInfo?: SessionSymbolInfo;
  quote: Quote;
  orderType: string;
  orderPrice: string | number;
  volume: string | number;
  limitedPrice?: string | number;
  priceOrderType?: string;
}
const props = defineProps<Props>();
const price = defineModel("price", { type: String, default: "" });

// 止盈止损验证规则

// 至少远离市价点数
const minDisPoint = computed(() => {
  let result = 0;
  if (props.symbolInfo) {
    const digits = props.symbolInfo.digits;
    const stopsLevel = props.symbolInfo.stops_level;
    result = stopsLevel / Math.pow(10, +digits);
  }
  return result;
});

// 获取止盈止损范围
const getRange = () => {
  const leadOption: Record<string, any> = {
    price: props.quote.ask,
    buyLimit: +props.orderPrice,
    sellLimit: +props.orderPrice,
    buyStop: +props.orderPrice,
    sellStop: +props.orderPrice,
    buyStopLimit: props.limitedPrice || 0,
    sellStopLimit: props.limitedPrice || 0,
  };
  if (props.symbolInfo) {
    const digits = props.symbolInfo.digits;
    const lead = +leadOption[props.orderType] || 0;
    const down = +round(lead - minDisPoint.value, digits);
    const up = +round(lead + minDisPoint.value, digits);
    return [down, up];
  }
  return [0, 0];
};

const initPrice = () => {
  if (price.value === "") {
    const [down, up] = getRange();
    if (props.type === "stopLoss") {
      return String(down);
    }
    if (props.type === "stopProfit") {
      return String(up);
    }
  }
  return false;
};

const rangeTip = ref("");

const setHelp = () => {
  const value = price.value;
  if (value === "") {
    rangeTip.value = "";
    return;
  }
  const orderType = props.orderType;
  const [down, up] = getRange();
  const ifLoss = props.type === "stopLoss";
  let result = "";
  switch (orderType) {
    case "price":
      if (props.priceOrderType === "buy") {
        if (ifLoss && +value > down) {
          result = `止损价 ≤ ${down}`;
        }
        if (!ifLoss && +value < up) {
          result = `止盈价 ≥ ${up}`;
        }
      }
      if (props.priceOrderType === "sell") {
        if (ifLoss && +value < up) {
          result = `止损价 ≥ ${up}`;
        }
        if (!ifLoss && +value > down) {
          result = `止盈价 ≤ ${down}`;
        }
      }
      break;
    case "buyLimit":
    case "buyStop":
    case "buy stop limit":
      if (ifLoss && +value > down) {
        result = `止损价 ≤ ${down}`;
      }
      if (!ifLoss && +value < up) {
        result = `止盈价 ≥ ${up}`;
      }
      break;
    case "sellLimit":
    case "sellStop":
    case "sellStopLimit":
      if (ifLoss && +value < down) {
        result = `止损价 ≥ ${down}`;
      }
      if (!ifLoss && +value > up) {
        result = `止盈价 ≤ ${up}`;
      }
      break;
    default:
      break;
  }
  rangeTip.value = result;
};

watch(
  () => [props.symbolInfo, props.quote, price.value],
  () => setHelp(),
  {
    deep: true,
  }
);

const profit = computed(() => {
  let result: string | number = "";
  const ask = props.quote.ask;
  const bid = props.quote.bid;
  const openPrice =
    props.orderType === "price" || props.orderType.includes("buy") ? ask : bid;
  // profit = 平仓合约价值 - 建仓合约价值 + 手续费 + 过夜费
  // 建仓合约价值 = open_price X contract_size X volume / 100
  // 平仓合约价值 = close_price X contract_size X volume / 100
  const closePrice = +price.value;
  const volume = +props.volume;
  if (props.symbolInfo) {
    const { contract_size, storage, fee, digits } = props.symbolInfo;
    const buildingPrice = +((openPrice * contract_size * volume) / 100).toFixed(
      digits
    );
    const closingPrice = +((closePrice * contract_size * volume) / 100).toFixed(
      digits
    );
    result = closingPrice - buildingPrice + (storage || 0) + (fee || 0);
    result = result.toFixed(digits);
  }
  return result;
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.tip {
  @include font_color("word-gray");
}
</style>
