<template>
  <div :style="styles.orderBtn">
    <div :style="styles.area">
      <div :style="wordStyle('sell')">
        {{ bid }}
      </div>
      <div :style="btnStyle('sell')" @click="creatOrder('sell')">
        {{ $t("order.sell") }}
      </div>
    </div>
    <div :style="{ ...inputAreaStyle, boxSizing: 'border-box' }">
      <UpOutlined :style="styles.icon" @click="addNum" />
      <input
        :style="{ ...styles.input, textAlign: 'center' }"
        type="text"
        v-model="volume"
      />
      <DownOutlined :style="styles.icon" @click="reduceNum" />
    </div>
    <div :style="styles.area">
      <div :style="btnStyle('buy')" @click="creatOrder('buy')">
        {{ $t("order.buy") }}
      </div>
      <div :style="wordStyle('buy')">
        {{ ask }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from "vue";
import { UpOutlined, DownOutlined } from "@ant-design/icons-vue";
import { useChartSub } from "@/store/modules/chartSub";
import { marketOrdersAdd, ReqOrderAdd } from "api/order/index";
import { ORDER_TYPE } from "@/constants/common";
import { SessionSymbolInfo } from "@/types/chart/index";
import { useChartInit } from "@/store/modules/chartInit";
import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { useTheme } from "@/store/modules/theme";
import { ElMessage } from "element-plus";

const subStore = useChartSub();
const chartInitStore = useChartInit();
const dialogStore = useDialog();
const orderStore = useOrder();
const themeStore = useTheme();

// 样式
const styles = {
  orderBtn: {
    display: "flex",
    height: "18px",
    width: "267px",
    justifyContent: "space-between",
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
    height: "18px",
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
    height: "18px",
    padding: "0 5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
const downColor = computed(() => {
  return themeStore.upDownTheme === "upRedDownGreen" ? "#009355" : "#DC1D43";
});
const upColor = computed(() => {
  return themeStore.upDownTheme === "upRedDownGreen" ? "#DC1D43" : "#009355";
});
const wordStyle = (type: "sell" | "buy") => {
  return {
    ...styles.btn,
    width: "51px",
    backgroundColor: type === "sell" ? downColor.value : upColor.value,
    color: "#fff",
  };
};
const btnStyle = (type: "sell" | "buy") => {
  return {
    ...styles.btn,
    backgroundColor: type === "sell" ? downColor.value : upColor.value,
    opacity: 0.8,
    cursor: "pointer",
    color: "#fff",
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

const currentSymbol = computed(() => {
  const chartSymbol = chartInitStore.getChartWidgetListSymbol(props.id);
  return chartSymbol || props.symbol;
});

const bid = computed(() => {
  return getQuotes("bid", currentSymbol.value);
});

const ask = computed(() => {
  return getQuotes("ask", currentSymbol.value);
});

const getQuotes = (type: "bid" | "ask", symbol: string) => {
  if (orderStore.currentQuotes[symbol]) {
    return orderStore.currentQuotes[symbol][type];
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
const symbolInfo = ref<SessionSymbolInfo>();
watchEffect(() => {
  const info = subStore.symbols.find((e) => e.symbol === currentSymbol.value);
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
const creatOrder = async (type: "sell" | "buy") => {
  const ifOne = orderStore.getOneTrans();
  if (ifOne === null) {
    dialogStore.disclaimers = true;
    return;
  }
  if (!orderStore.ifOne) {
    orderStore.createOrder();
    return;
  }
  const v = valid();
  if (v) {
    const updata: ReqOrderAdd = {
      symbol: currentSymbol.value,
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
