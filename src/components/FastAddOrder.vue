<template>
  <div :style="styles.addOrder">
    <div :style="styles.area">
      <div :style="wordStyle('sell')">
        {{ bid }}
      </div>
      <div :style="btnStyle('sell')" @click="addOrder('sell')">
        {{ $t("order.sell") }}
      </div>
    </div>
    <div :style="{ ...inputAreaStyle, boxSizing: 'border-box' }">
      <BaseImg :style="styles.icon" iconName="caretDown" @click="reduceNum" />
      <input
        :style="{ ...styles.input, textAlign: 'center' }"
        type="text"
        v-model="volume"
      />
      <BaseImg iconName="caretUp" :style="styles.icon" @click="addNum" />
    </div>
    <div :style="styles.area">
      <div :style="btnStyle('buy')" @click="addOrder('buy')">
        {{ $t("order.buy") }}
      </div>
      <div :style="wordStyle('buy')">
        {{ ask }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from "element-plus";
import { computed, ref, watchEffect } from "vue";

import { DirectionType } from "#/order";

import { ORDER_TYPE } from "@/constants/common";
import { ISessionSymbolInfo } from "@/types/chart/index";
import { marketOrdersAdd, ReqOrderAdd } from "api/order/index";

import { useChartInit } from "@/store/modules/chartInit";
import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { useSymbols } from "@/store/modules/symbols";
import { useTheme } from "@/store/modules/theme";

const chartInitStore = useChartInit();
const dialogStore = useDialog();
const orderStore = useOrder();
const themeStore = useTheme();
const symbolsStore = useSymbols();

// 样式
const styles = {
  addOrder: {
    display: "flex",
    height: "24px",
    justifyContent: "space-between",
    gap: "2px",
  },
  area: {
    display: "flex",
  },
  inputArea: {
    display: "flex",
    border: "1px solid",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    height: "24px",
  },
  input: {
    border: "none",
    width: "50px",
    height: "14px",
  },
  icon: {
    fontSize: "12px",
    scale: "0.5",
    width: "12px",
    height: "12px",
    cursor: "pointer",
  },
  btn: {
    height: "24px",
    padding: "0 5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
  },
  word: {
    height: "24px",
    padding: "0 5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "51px",
    color: "#fff",
  },
};
const wordDownColor = computed(() => {
  return themeStore.upDownTheme === "upRedDownGreen" ? "#00C673" : "#FF4A61";
});
const wordUpColor = computed(() => {
  return themeStore.upDownTheme === "upRedDownGreen" ? "#FF4A61" : "#00C673";
});
const wordStyle = (type: DirectionType) => {
  return {
    ...styles.word,
    backgroundColor: type === "sell" ? wordDownColor.value : wordUpColor.value,
    borderRadius: type === "sell" ? "2px 0 0 2px" : "0 2px 2px 0",
  };
};

const btnDownColor = computed(() => {
  return themeStore.upDownTheme === "upRedDownGreen" ? "#009355" : "#DC1D43";
});
const btnUpColor = computed(() => {
  return themeStore.upDownTheme === "upRedDownGreen" ? "#DC1D43" : "#009355";
});

const btnStyle = (type: DirectionType) => {
  return {
    ...styles.btn,
    backgroundColor: type === "sell" ? btnDownColor.value : btnUpColor.value,
  };
};
const inputAreaStyle = computed(() => {
  const color = themeStore.systemTheme === "light" ? "#081021" : "#d1d4dc";
  const borderColor =
    themeStore.systemTheme === "light" ? "#dee2e9" : "#434651";
  const backgroundColor =
    themeStore.systemTheme === "light" ? "#fff" : "#525252";
  return {
    ...styles.inputArea,
    color,
    backgroundColor,
    borderColor,
  };
});

interface Props {
  symbol: string;
  id: string;
}
const props = defineProps<Props>();

const nowSymbol = computed(() => {
  const chartSymbol = chartInitStore.getChartSymbol(props.id);
  return chartSymbol || props.symbol;
});

const bid = computed(() => {
  return getQuotes("bid", nowSymbol.value);
});

const ask = computed(() => {
  return getQuotes("ask", nowSymbol.value);
});

const getQuotes = (type: "bid" | "ask", symbol: string) => {
  const digits = symbolInfo.value?.digits;
  if (orderStore.currentQuotes[symbol] && digits) {
    return orderStore.currentQuotes[symbol][type].toFixed(digits);
  }
  return "-";
};

// 下单手数
const volume = ref<string>("");
// 单笔最小手数
const minVolume = ref<string>("0");
// 单笔最大手数
const maxVolume = ref<string>("0");

// 当前品种
const symbolInfo = ref<ISessionSymbolInfo>();
watchEffect(() => {
  const info = symbolsStore.symbols.find((e) => e.symbol === nowSymbol.value);
  if (info) {
    symbolInfo.value = info;
    minVolume.value = (info.volume_min / 100).toString();
    maxVolume.value = (info.volume_max / 100).toString();
    volume.value = minVolume.value;
  }
});

const step = computed(() => {
  return symbolInfo.value ? symbolInfo.value.volume_step / 100 : 1;
});

import { accAdd, accSub } from "utils/arithmetic";
const addNum = () => {
  volume.value = accAdd(+volume.value, step.value).toString();
};
const reduceNum = () => {
  const result = accSub(+volume.value, step.value);
  if (+result <= 0) {
    return;
  }
  volume.value = result.toString();
};

const regex = /^-?\d+(\.\d+)?$/;
const valid = () => {
  const value = volume.value;
  if (value === undefined) {
    ElMessage.error("请输入手数");
    return false;
  }
  if (!regex.test(value)) {
    ElMessage.error("请输入正确的数字格式");
    return false;
  }
  if (value < minVolume.value) {
    ElMessage.error(`不能小于单笔最小手数${minVolume.value}`);
    return false;
  }
  if (value > maxVolume.value) {
    ElMessage.error(`不能大于单笔最大手数${maxVolume.value}`);
    return false;
  }
  return true;
};
const addOrder = async (type: DirectionType) => {
  const ifOne = orderStore.getOneTrans();
  if (ifOne === null) {
    dialogStore.disclaimers = true;
    return;
  }
  if (!orderStore.ifOne) {
    orderStore.createOrder({
      symbol: nowSymbol.value,
      mode: "confirm",
      directionType: type,
      volume: volume.value,
    });
    return;
  }
  const v = valid();
  if (v) {
    const updata: ReqOrderAdd = {
      symbol: nowSymbol.value,
      type: ORDER_TYPE.price[type],
      volume: +(volume.value || 0) * 100,
    };
    const res = await marketOrdersAdd(updata);
    if (res.data.action_success) {
      ElMessage.success("下单成功");
      return;
    }
    ElMessage.error(`下单失败：${res.data.err_text}`);
  }
};
</script>
