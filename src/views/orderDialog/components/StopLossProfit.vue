<template>
  <el-form-item label-position="top" :prop="props.type" label-width="100%">
    <template #label>
      <div class="title">
        <span style="white-space: nowrap">{{ titleMap[props.type] }}</span>
        <el-tooltip :content="`${minPoint}`" placement="top" v-if="!rangeTip">
          <el-text class="textEllipsis" style="width: 130px" type="info">{{
            minPoint
          }}</el-text>
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
      <span class="tip" v-if="profit"
        >{{ $t("order.expectedGrossProfit") }}: {{ profit }}</span
      >
    </el-form-item>
  </el-form-item>
</template>

<script setup lang="ts">
import { IQuote, ISessionSymbolInfo } from "#/chart/index";
import { useRate } from "@/store/modules/rate";
import { round } from "utils/common/index";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const rateStore = useRate();

const titleMap = {
  stopLoss: t("order.sl"),
  stopProfit: t("order.tp"),
};
interface Props {
  type: "stopLoss" | "stopProfit";
  symbolInfo?: ISessionSymbolInfo;
  quote?: IQuote;
  orderType: string;
  orderPrice: string | number | null;
  volume: string | number;
  limitedPrice?: string | number;
}
const props = defineProps<Props>();
const price = defineModel<string>("price", { default: "" });

// 至少远离市价点数
const minPoint = computed(() => {
  let result = "-";
  if (props.symbolInfo) {
    const stopsLevel = props.symbolInfo.stops_level;
    result = t("tip.minFastPoint", { size: stopsLevel });
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
    buyStopLimit: props.limitedPrice,
    sellStopLimit: props.limitedPrice,
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
  if (["", null, undefined].includes(price.value)) {
    return "";
  }
  const value = price.value;
  const orderType = props.orderType.toLowerCase();
  const [down, up] = getRange();
  const ifLoss = props.type === "stopLoss";
  let range = "";
  let valid = true;
  switch (orderType) {
    case "buyprice":
      if (ifLoss) {
        range = `≤ ${down}`;
        value && (valid = +value <= down);
      }
      if (!ifLoss) {
        range = `≥ ${up}`;
        value && (valid = +value >= up);
      }
      break;
    case "sellprice":
      if (ifLoss) {
        range = `≥ ${up}`;
        value && (valid = +value >= up);
      }
      if (!ifLoss) {
        range = `≤ ${down}`;
        value && (valid = +value <= down);
      }
      break;
    case "buylimit":
    case "buystop":
    case "buystoplimit":
      if (ifLoss) {
        range = `≤ ${down}`;
        value && (valid = +value <= down);
      }
      if (!ifLoss) {
        range = `≥ ${up}`;
        value && (valid = +value >= up);
      }
      break;
    case "selllimit":
    case "sellstop":
    case "sellstoplimit":
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
      range = "";
      break;
  }
  rangeTip.value = range;
  ifError.value = !valid;
};

watch(
  () => [
    props.orderType,
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

/**
 * openPrice：    建仓价
 * closePrice：   平仓价（市价单->持仓多单时：closePrice = 现价卖价、持仓空单时，closePrice = 现价买价；止盈止损价）
 * contractSize： 订单品种合约数量
 * volume：       手数
 * fee：          手续费
 * storage：      库存费
 * 建仓合约价值 = open_price * contract_size *volume / 100
 * 平仓合约价值 = close_price *contract_size * volume / 100
 * buy时: profit = （平仓合约价值 - 建仓合约价值 + 库存费 +  手续费） * 利率
 * sell时: profit = （建仓合约价值 - 平仓合约价值 + 库存费 +  手续费） * 利率
 **/

//  盈亏
const profit = computed(() => {
  const type = props.orderType.toLowerCase();
  const ifBuy = type.includes("buy");
  const ifSell = type.includes("sell");
  // 止盈止损为空并且没有确定方向不计算
  if (["", null, undefined].includes(price.value) || (!ifBuy && !ifSell)) {
    return "";
  }
  const ask = props.quote?.ask;
  const bid = props.quote?.bid;
  let open_price;
  if (type.includes("price")) {
    open_price = ifBuy ? ask : bid;
  } else {
    open_price = props.orderPrice;
  }
  if (props.symbolInfo && open_price) {
    let result: number | null = null;
    const volume = +props.volume;
    const { contract_size, storage, fee, digits, symbol } = props.symbolInfo;
    const buildingPrice = +open_price * contract_size * volume; // 建仓合约价值
    const closingPrice = +price.value * contract_size * volume; // 平仓合约价值

    const rateMap = rateStore.getSymbolRate(symbol);
    const rate = ifBuy ? rateMap.ask_rate : rateMap.bid_rate;
    if (ifBuy) {
      result = (closingPrice - buildingPrice + fee || 0 + storage || 0) * rate;
    }
    if (ifSell) {
      result = (buildingPrice - closingPrice + fee || 0 + storage || 0) * rate;
    }
    if (result) {
      return result.toFixed(digits);
    }
  }
  return "";
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
