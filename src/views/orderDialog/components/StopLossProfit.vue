<template>
  <el-form-item label-position="top" :prop="props.type" label-width="100%">
    <template #label>
      <div class="title">
        <span style="white-space: nowrap">{{ titleMap[props.type] }}</span>
        <el-tooltip :content="minPoint" placement="top" v-if="!rangeTip">
          <el-text class="textEllipsis" type="info">{{ minPoint }}</el-text>
        </el-tooltip>
        <el-text
          class="textEllipsis"
          :type="ifError ? 'danger' : 'info'"
          v-if="rangeTip"
          >{{ rangeTip }}</el-text
        >
      </div>
    </template>
    <StepNumInput
      v-model:value="price"
      :step="step"
      :customSub="customCal"
      :customAdd="customCal"
      :valid="ifError"
      @input="handleInput"
      @blur="handleBlur"
    ></StepNumInput>
    <el-form-item>
      <span class="tip textEllipsis" v-if="profit"
        >{{ $t("order.expectedGrossProfit") }}: {{ profit }}</span
      >
    </el-form-item>
  </el-form-item>
</template>

<script setup lang="ts">
import { IQuote, ISessionSymbolInfo } from "#/chart/index";
import { round } from "utils/common/index";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useOrder } from "@/store/modules/order";

const orderStore = useOrder();
const { t } = useI18n();

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
  fee?: number;
  storage?: number;
}

const props = defineProps<Props>();
const price = defineModel<string | number>("price", { default: "" });

const rangeTip = ref("");
const ifError = ref(false);

// 步长
const step = computed(() => {
  return props.symbolInfo ? 50 / Math.pow(10, props.symbolInfo.digits) : 0.5;
});

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
      price: ask,
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
        case "price":
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

// 止盈止损范围提示
const setRangeTip = () => {
  const type = props.orderType;
  const text = type.match(/sell|buy/);
  // 没有确定方向不提示
  if (!text) {
    return "";
  }
  const range = getRange();
  if (range === null) {
    rangeTip.value = "";
    return;
  }
  let tip = "";
  const { maxTP, minTP, maxSL, minSL } = range;
  if (props.type === "stopLoss") {
    if (minSL) {
      tip = `≥ ${minSL}`;
    }
    if (maxSL) {
      tip = `≤ ${maxSL}`;
    }
  }
  if (props.type === "stopProfit") {
    if (minTP) {
      tip = `≥ ${minTP}`;
    }
    if (maxTP) {
      tip = `≤ ${maxTP}`;
    }
  }
  rangeTip.value = tip;
};

// 校验
watch(
  () => [rangeTip.value, price.value],
  () => {
    if (price.value) {
      const range = getRange();
      if (range) {
        const { maxTP, minTP, maxSL, minSL } = range;
        let valid = true;
        const value = +price.value;
        if (props.type === "stopLoss") {
          if (minSL) {
            valid = value >= +minSL;
          }
          if (maxSL) {
            valid = value <= +maxSL;
          }
        }
        if (props.type === "stopProfit") {
          if (minTP) {
            valid = value >= +minTP;
          }
          if (maxTP) {
            valid = value <= +maxTP;
          }
        }
        ifError.value = !valid;
      }
    } else {
      ifError.value = false;
    }
  }
);

// 自动填充
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
  if (price.value === "" || !text) {
    return "";
  }
  const buildPrice = ["buyStopLimit", "sellStopLimit"].includes(type)
    ? props.limitedPrice
    : props.orderPrice;
  const closePrice = +price.value;
  const volume = +props.volume;
  if (buildPrice && props.symbolInfo) {
    const { symbol, fee } = props.symbolInfo;
    const direction = text[0] as "sell" | "buy";
    const params = {
      symbol,
      buildPrice: +buildPrice,
      closePrice,
      volume,
      fee: -(fee * volume),
      storage: 0,
    };
    if (!isNil(props.fee)) {
      params.fee = props.fee;
    }
    if (!isNil(props.storage)) {
      params.storage = props.storage;
    }
    const profit = orderStore.getProfit(params, direction);
    return profit;
  }
  return "";
});

watch(
  () => [
    props.orderType,
    props.symbolInfo,
    props.quote,
    price.value,
    props.orderPrice,
    props.limitedPrice,
  ],
  () => setRangeTip(),
  {
    deep: true,
    immediate: true,
  }
);

import { isNil } from "lodash";
import { limitdigit } from "utils/common/index";
const handleInput = (value: string | number) => {
  if (props.symbolInfo) {
    const { digits } = props.symbolInfo;
    price.value = limitdigit(value, digits);
  }
};
const handleBlur = (value: string | number) => {
  if (value && props.symbolInfo) {
    const { digits } = props.symbolInfo;
    const str = value.toString();
    const parts = str.split(".");
    if (parts.length === 2) {
      const integerPart = parts[0];
      let decimalPart = parts[1];
      while (decimalPart.length < digits) {
        decimalPart += "0";
      }
      price.value = integerPart + "." + decimalPart;
    }
    if (parts.length === 1) {
      let decimalPart = "";
      for (let i = 0; i < digits; i++) {
        decimalPart += "0";
      }
      price.value = `${value}.${decimalPart}`;
    }
  }
};
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
