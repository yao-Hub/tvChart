<template>
  <el-form-item label-position="top" :prop="props.type" label-width="100%">
    <template #label>
      <div class="title">
        <span style="white-space: nowrap">{{ titleMap[props.type] }}</span>
        <el-tooltip :content="minPoint" placement="top" v-if="!price">
          <el-text class="textEllipsis" type="info">{{ minPoint }}</el-text>
        </el-tooltip>
        <el-text :type="ifError ? 'danger' : 'info'" v-if="price">{{
          rangeTip
        }}</el-text>
      </div>
    </template>
    <StepNumInput
      v-model:value="price"
      :step="step"
      :customSub="customCal"
      :customAdd="customCal"
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
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const rateStore = useRate();

const step = 0.5;

const titleMap = {
  stopLoss: t("order.sl"),
  stopProfit: t("order.tp"),
};

interface Props {
  type: "stopLoss" | "stopProfit";
  symbolInfo?: ISessionSymbolInfo;
  quote: IQuote;
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
  try {
    const type = props.orderType;
    const ask = props.quote.ask;
    const bid = props.quote.bid;
    if (!ask || !bid) {
      return null;
    }
    // 不同订单类型基数选取
    const baseNumMap: Record<string, any> = {
      sellPrice: ask,
      buyPrice: bid,
      buyLimit: props.orderPrice,
      sellLimit: props.orderPrice,
      buyStop: props.orderPrice,
      sellStop: props.orderPrice,
      buyStopLimit: props.limitedPrice,
      sellStopLimit: props.limitedPrice,
    };
    const baseNum = [undefined, null, ""].includes(baseNumMap[type])
      ? null
      : +baseNumMap[type];
    let maxTP = "";
    let minTP = "";
    let maxSL = "";
    let minSL = "";
    if (props.symbolInfo && baseNum) {
      const { digits, stops_level } = props.symbolInfo;
      // 距离
      const distance = stops_level / Math.pow(10, digits);
      // 点差
      const spread = ask - bid;
      switch (type) {
        case "buyPrice":
          minTP = round(baseNum + distance, digits);
          maxSL = round(baseNum - distance, digits);
          break;
        case "sellPrice":
          minSL = round(baseNum + distance, digits);
          maxTP = round(baseNum - distance, digits);
          break;
        case "buyLimit":
          minTP = round(baseNum - spread + distance, digits);
          maxSL = round(baseNum - spread - distance, digits);
          break;
        case "sellLimit":
          minSL = round(baseNum + spread + distance, digits);
          maxTP = round(baseNum + spread - distance, digits);
          break;
        case "buyStop":
          minTP = round(baseNum - spread + distance, digits);
          maxSL = round(baseNum - spread - distance, digits);
          break;
        case "sellStop":
          minSL = round(baseNum + spread + distance, digits);
          maxTP = round(baseNum + spread - distance, digits);
          break;
        case "buyStopLimit":
          minTP = round(baseNum - spread + distance, digits);
          maxSL = round(baseNum - spread - distance, digits);
          break;
        case "sellStopLimit":
          minSL = round(baseNum + spread + distance, digits);
          maxTP = round(baseNum + spread - distance, digits);
          break;
        default:
          break;
      }
    }
    return {
      maxTP,
      minTP,
      maxSL,
      minSL,
    };
  } catch (error) {
    return null;
  }
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
  () => setRange(),
  {
    deep: true,
  }
);
onMounted(() => setRange());

// 止盈止损范围提示
const rangeTip = ref("");
const ifError = ref(false);
const setRange = () => {
  if (["", null, undefined].includes(price.value)) {
    rangeTip.value = "";
    ifError.value = false;
    return;
  }
  const range = getRange();
  if (range === null) {
    rangeTip.value = "";
    ifError.value = true;
    return;
  }
  let tip = "";
  let valid = true;
  const { maxTP, minTP, maxSL, minSL } = range;
  const value = +price.value;
  if (props.type === "stopLoss") {
    if (minSL) {
      tip = `≥ ${minSL}`;
      valid = value >= +minSL;
    }
    if (maxSL) {
      tip = `≤ ${maxSL}`;
      valid = value <= +maxSL;
    }
  }
  if (props.type === "stopProfit") {
    if (minTP) {
      tip = `≥ ${minTP}`;
      valid = value >= +minTP;
    }
    if (maxTP) {
      tip = `≤ ${maxTP}`;
      valid = value <= +maxTP;
    }
  }
  rangeTip.value = tip;
  ifError.value = !valid;
};

const customCal = () => {
  if (price.value === "") {
    const range = getRange();
    if (range !== null) {
      const { maxTP, minTP, maxSL, minSL } = range;
      if (props.type === "stopLoss") {
        return maxSL || minSL || null;
      }
      if (props.type === "stopProfit") {
        return maxTP || minTP || null;
      }
    }
  }
};

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
}
</style>
