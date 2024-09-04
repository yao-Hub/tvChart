<template>
  <a-form-item
    :name="props.type"
    :label="titleMap[props.type]"
    :rules="[
      {
        required: false,
        trigger: ['change', 'blur'],
        validator: validatorMap[props.type],
      },
    ]"
  >
    <StepNumInput v-model:value="price"></StepNumInput>
    <a-form-item no-style>
      <span class="tip" v-if="props.symbolInfo && price === ''">至少远离市价{{ props.symbolInfo?.stops_level }}点</span>
      <span class="tip" v-if="props.symbolInfo && price !== ''">预计{{ tipWordType }}: {{ profit }}</span>
    </a-form-item>
  </a-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
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
}
const props = defineProps<Props>();
const price = defineModel("price", { type: String, default: "" });

const tipWordType = computed(() => {
  if (props.type === "stopLoss") {
    return "亏损";
  }
  if (props.type === "stopProfit") {
    return "盈利";
  }
  return "盈亏";
});

// 止盈止损验证规则
const ifBuy = computed(() =>
  props.orderType.toLocaleLowerCase().includes("buy")
);
const ifSell = computed(() =>
  props.orderType.toLocaleLowerCase().includes("sell")
);
const getLead = (type: "sell" | "buy") => {
  const digits = props.symbolInfo?.digits || 0;
  const stopsLevel = props.symbolInfo?.stops_level || 0;
  const priceVal = type === "buy" ? props.quote.ask : props.quote.bid;
  const lead = props.orderType.toLocaleLowerCase().includes("price")
    ? priceVal
    : +(props.orderPrice || 0);
  const result_1 = lead - (1 / Math.pow(10, +digits)) * +stopsLevel;
  const result_2 = lead + (1 / Math.pow(10, +digits)) * +stopsLevel;
  return {
    result_1: round(result_1, +digits),
    result_2: round(result_2, +digits),
  };
};
const validLoss = () => {
  const stopLoss = price.value;
  if (stopLoss === "") {
    return Promise.resolve();
  }
  const buyPrice = getLead("buy").result_1;
  const sellPrice = getLead("sell").result_2;
  if (ifBuy.value && +stopLoss > buyPrice) {
    return Promise.reject(`止损价不能大于${buyPrice}`);
  }
  if (ifSell.value && +stopLoss < sellPrice) {
    return Promise.reject(`止损价不能小于${sellPrice}`);
  }
  return Promise.resolve();
};
const validProfit = () => {
  const stopProfit = price.value;
  if (stopProfit === "") {
    return Promise.resolve();
  }
  const buyPrice = getLead("buy").result_2;
  const sellPrice = getLead("sell").result_1;
  if (ifBuy.value && +stopProfit < buyPrice) {
    return Promise.reject(`止盈价不能小于${buyPrice}`);
  }
  if (ifSell.value && +stopProfit > sellPrice) {
    return Promise.reject(`止盈价不能大于${sellPrice}`);
  }
  return Promise.resolve();
};
const validatorMap = {
  stopLoss: validLoss,
  stopProfit: validProfit,
};

const profit = computed(() => {
  let result: string | number = "";
  const ask = props.quote.ask;
  const bid = props.quote.bid;
  const openPrice = ifBuy.value ? ask : bid;
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
@import "@/assets/styles/_handle.scss";

.tip {
  @include font_color("word-gray");
}
</style>
