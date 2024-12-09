<template>
  <el-form-item label-position="top" :prop="props.type" label-width="100%">
    <template #label>
      <div class="title">
        <span style="white-space: nowrap">{{ titleMap[props.type] }}</span>
        <el-tooltip :content="`${minPoint}`" placement="top">
          <el-text
            class="textEllipsis"
            style="width: 130px"
            type="info"
            v-if="!price"
            >{{ minPoint }}</el-text
          >
        </el-tooltip>
        <el-text :type="ifError ? 'danger' : 'info'" v-if="rangeTip && price">{{
          rangeTip
        }}</el-text>
      </div>
    </template>
    <StepNumInput
      v-model:value="price"
      :customSub="initPrice"
      :customAdd="initPrice"
      :valid="ifError"
    ></StepNumInput>
    <el-form-item>
      <span class="tip" v-if="profit">预计毛利: {{ profit }}</span>
    </el-form-item>
  </el-form-item>
</template>

<script setup lang="ts">
import { IQuote, ISessionSymbolInfo } from "#/chart/index";
import { round } from "utils/common/index";
import { computed, ref, watch } from "vue";

const titleMap = {
  stopLoss: "止损",
  stopProfit: "止盈",
};
interface Props {
  type: "stopLoss" | "stopProfit";
  symbolInfo?: ISessionSymbolInfo;
  quote?: IQuote;
  orderType: string;
  orderPrice: string | number | null;
  volume: string | number;
  limitedPrice?: string | number;
  priceOrderType?: string;
}
const props = defineProps<Props>();
const price = defineModel<string | number>("price");

// 至少远离市价点数
const minPoint = computed(() => {
  let result = "-";
  if (props.symbolInfo) {
    const stopsLevel = props.symbolInfo.stops_level;
    result = `至少远离市价${stopsLevel}点`;
  }
  return result;
});

// 获取止盈止损范围
const getRange = () => {
  const leadOption: Record<string, any> = {
    price: props.quote?.ask,
    buyLimit: props.orderPrice,
    sellLimit: props.orderPrice,
    buyStop: props.orderPrice,
    sellStop: props.orderPrice,
    buyStopLimit: props.limitedPrice || 0,
    sellStopLimit: props.limitedPrice || 0,
  };
  if (props.symbolInfo) {
    const digits = props.symbolInfo.digits;
    const stopsLevel = props.symbolInfo.stops_level;
    const point = stopsLevel / Math.pow(10, +digits);
    stopsLevel / Math.pow(10, +digits);
    const lead = +leadOption[props.orderType] || 0;
    const down = +round(lead - point, digits);
    const up = +round(lead + point, digits);
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
const ifError = ref(false);
const setHelp = () => {
  const value = price.value;
  const orderType = props.orderType;
  const [down, up] = getRange();
  const ifLoss = props.type === "stopLoss";
  let range = "";
  let valid = true;
  switch (orderType) {
    case "price":
      if (props.priceOrderType === "buy") {
        if (ifLoss) {
          range = `≤ ${down}`;
          value && (valid = +value <= down);
        }
        if (!ifLoss) {
          range = `≥ ${up}`;
          value && (valid = +value >= up);
        }
      }
      if (props.priceOrderType === "sell") {
        if (ifLoss) {
          range = `≥ ${up}`;
          value && (valid = +value >= up);
        }
        if (!ifLoss) {
          range = `≤ ${down}`;
          value && (valid = +value <= down);
        }
      }
      break;
    case "buyLimit":
    case "buyStop":
    case "buyStopLimit":
      if (ifLoss) {
        range = `≤ ${down}`;
        value && (valid = +value <= down);
      }
      if (!ifLoss) {
        range = `≥ ${up}`;
        value && (valid = +value >= up);
      }
      break;
    case "sellLimit":
    case "sellStop":
    case "sellStopLimit":
      if (ifLoss) {
        range = `≥ ${down}`;
        value && (valid = +value >= down);
      }
      if (!ifLoss) {
        range = `≤ ${up}`;
        value && (valid = +value <= up);
      }
      break;
    default:
      break;
  }
  rangeTip.value = range;
  ifError.value = !valid;
};

watch(
  () => [
    props.symbolInfo,
    props.quote,
    price.value,
    props.orderPrice,
    props.limitedPrice,
  ],
  () => setHelp(),
  {
    deep: true,
  }
);

const profit = computed(() => {
  if (price.value === null || price.value === undefined || price.value === "") {
    return "";
  }
  let result: string | number = "";
  const ask = props.quote?.ask;
  const bid = props.quote?.bid;
  const openPrice =
    props.orderType === "price" || props.orderType.includes("buy") ? ask : bid;
  // profit = 平仓合约价值 - 建仓合约价值 + 手续费 + 过夜费
  // 建仓合约价值 = open_price X contract_size X volume / 100
  // 平仓合约价值 = close_price X contract_size X volume / 100
  const closePrice = +price.value;
  const volume = +props.volume;
  if (props.symbolInfo && openPrice) {
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
:deep(.el-form-item__label) {
  width: 100%;
}
.title {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 20px;
}
</style>
