<template>
  <a-form-item
    :name="props.type"
    :label="titleMap[props.type]"
    :help="helpMap[props.type]"
    :validate-status="helpMap[props.type] ? 'error' : ''"
  >
    <StepNumInput v-model:value="price"></StepNumInput>
    <a-form-item no-style>
      <span class="tip" v-if="props.symbolInfo && price === ''">至少远离市价{{ props.symbolInfo?.stops_level }}点</span>
      <span class="tip" v-if="props.symbolInfo && price !== ''">预计{{ tipWordType }}: {{ profit }}</span>
    </a-form-item>
  </a-form-item>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
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
  if (props.symbolInfo) {
    const digits = props.symbolInfo.digits;
    const stopsLevel = props.symbolInfo.stops_level;
    const priceVal = type === "buy" ? props.quote.ask : props.quote.bid;
    const lead = props.orderType.toLocaleLowerCase().includes("price")
      ? priceVal
      : +props.orderPrice;
    const result_1 = lead - (1 / Math.pow(10, +digits)) * stopsLevel;
    const result_2 = lead + (1 / Math.pow(10, +digits)) * stopsLevel;
    return {
      result_1: round(result_1, +digits),
      result_2: round(result_2, +digits),
    };
  }
};

const helpMap = reactive({
  stopLoss: "",
  stopProfit: "",
});

const setStopLossHelp = () => {
  const stopLoss = price.value;
  if (stopLoss === "") {
    helpMap.stopLoss = "";
    return;
  }
  if (ifBuy.value) {
    const leed = getLead("buy");
    if (leed) {
      const { result_1 } = leed;
      if (ifBuy.value && +stopLoss > +result_1) {
        helpMap.stopLoss = `止损价不能大于${result_1}`;
        return;
      }
    }
  }
  if (ifSell.value) {
    const leed = getLead("sell");
    if (leed) {
      const { result_2 } = leed;
      if (ifBuy.value && +stopLoss < +result_2) {
        helpMap.stopLoss = `止损价不能小于${result_2}`;
        return;
      }
    }
  }
  helpMap.stopLoss = "";
};
const setStopProfitHelp = () => {
  const stopProfit = price.value;
  if (stopProfit === "") {
    helpMap.stopProfit = "";
    return;
  }
  if (ifBuy.value) {
    const leed = getLead("buy");
    if (leed) {
      const { result_2 } = leed;
      if (ifBuy.value && +stopProfit < +result_2) {
        helpMap.stopProfit = `止盈价不能小于${result_2}`;
        return;
      }
    }
  }
  if (ifSell.value) {
    const leed = getLead("sell");
    if (leed) {
      const { result_1 } = leed;
      if (ifBuy.value && +stopProfit < +result_1) {
        helpMap.stopProfit = `止盈价不能大于${result_1}`;
        return;
      }
    }
  }
  helpMap.stopProfit = "";
};

watch(
  () => [ props.symbolInfo, props.quote ],
  () => {
    setStopLossHelp();
    setStopProfitHelp();
  },
  {
    deep: true
  }
);


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
