<template>
  <el-form-item label-position="top" :prop="props.type" label-width="100%">
    <template #label>
      <div class="title">
        <span style="white-space: nowrap">{{ titleMap[props.type] }}</span>
        <el-tooltip :content="minPoint" placement="top" v-if="!rangeTip">
          <el-text class="textEllipsis" type="info">{{ minPoint }}</el-text>
        </el-tooltip>
        <el-text :type="ifError ? 'danger' : 'info'" v-if="rangeTip">{{
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
import { round } from "utils/common/index";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// import { useRate } from "@/store/modules/rate";
import { useOrder } from "@/store/modules/order";

const orderStore = useOrder();
const { t } = useI18n();
// const rateStore = useRate();

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
// 逻辑见 utrader2024/01_管理过程/架构图和流程图/预付款及盈亏计算方案.pdf
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
      return {
        maxTP,
        minTP,
        maxSL,
        minSL,
      };
    }
    return null;
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

//  盈亏
const profit = computed(() => {
  const type = props.orderType;
  const text = type.match(/sell|buy/);
  // 止盈止损为空并且没有确定方向不计算
  if (["", null, undefined].includes(price.value) || !text) {
    return "";
  }
  const buildPrice = ["buyStopLimit", "sellStopLimit"].includes(type)
    ? props.limitedPrice
    : props.orderPrice;
  const closePrice = +price.value;
  const volume = +props.volume;
  if (buildPrice && props.symbolInfo) {
    const direction = text[0] as "sell" | "buy";
    const profit = orderStore.getProfit(
      {
        symbol: props.symbolInfo.symbol,
        buildPrice: +buildPrice,
        closePrice,
        volume,
      },
      direction
    );
    return profit;
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
