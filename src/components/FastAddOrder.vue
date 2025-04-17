<template>
  <div :style="styles.addOrder">
    <div :style="styles.area">
      <div :style="wordStyle('sell')">
        {{ getQuotes("bid") }}
      </div>
      <div :style="btnStyle('sell')" @click="addOrder(1)">
        {{ t("order.sell") }}
      </div>
    </div>
    <div :style="{ ...inputAreaStyle, boxSizing: 'border-box' }">
      <BaseImg :style="styles.icon" iconName="caretDown" @click="reduceNum" />
      <input
        :style="{ ...styles.input, textAlign: 'center' }"
        v-model="volume"
        @input="handleInput"
      />
      <BaseImg iconName="caretUp" :style="styles.icon" @click="addNum" />
    </div>
    <div :style="styles.area">
      <div :style="btnStyle('buy')" @click="addOrder(0)">
        {{ t("order.buy") }}
      </div>
      <div :style="wordStyle('buy')">
        {{ getQuotes("ask") }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from "element-plus";
import { computed, ref, watchEffect } from "vue";
import { debounce } from "lodash";

import { DirectionType } from "#/order";

import { ISessionSymbolInfo } from "@/types/chart";
import { ReqOrderAdd } from "api/order/index";
import { limitdigit } from "@/utils/common";

import { useChartInit } from "@/store/modules/chartInit";
import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { useQuotes } from "@/store/modules/quotes";
import { useSymbols } from "@/store/modules/symbols";
import { useTheme } from "@/store/modules/theme";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

const chartInitStore = useChartInit();
const dialogStore = useDialog();
const orderStore = useOrder();
const themeStore = useTheme();
const symbolsStore = useSymbols();
const quotesStore = useQuotes();

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

const wordGreen = "#50AC8C";
const wordRed = "#F75173";
const wordDownColor = computed(() => {
  return themeStore.upDownTheme === "upRedDownGreen" ? wordGreen : wordRed;
});
const wordUpColor = computed(() => {
  return themeStore.upDownTheme === "upRedDownGreen" ? wordRed : wordGreen;
});
const wordStyle = (type: DirectionType) => {
  return {
    ...styles.word,
    backgroundColor: type === "sell" ? wordDownColor.value : wordUpColor.value,
    borderRadius: type === "sell" ? "2px 0 0 2px" : "0 2px 2px 0",
  };
};

const btnGreen = "#2E9C76";
const btnRed = "#F53058";
const btnDownColor = computed(() => {
  return themeStore.upDownTheme === "upRedDownGreen" ? btnGreen : btnRed;
});
const btnUpColor = computed(() => {
  return themeStore.upDownTheme === "upRedDownGreen" ? btnRed : btnGreen;
});

const btnStyle = (type: DirectionType) => {
  return {
    ...styles.btn,
    backgroundColor: type === "sell" ? btnDownColor.value : btnUpColor.value,
    opacity: ifCanTrade.value && !loading.value ? 1 : 0.5,
    cursor: ifCanTrade.value && !loading.value ? "pointer" : "not-allowed",
  };
};

const inputAreaStyle = computed(() => {
  const color = themeStore.systemTheme === "light" ? "#000" : "#fff";
  const borderColor =
    themeStore.systemTheme === "light" ? "#DEE2E9" : "#2C2F35";
  const backgroundColor = themeStore.systemTheme === "light" ? "#fff" : "#000";
  return {
    ...styles.inputArea,
    color,
    backgroundColor,
    borderColor,
  };
});

interface Props {
  id: string;
}
const props = defineProps<Props>();

const ifCanTrade = computed(() => {
  const symbols = symbolsStore.symbolsTradeAllow.map((item) => item.symbol);
  return symbols.includes(nowSymbol.value);
});

const nowSymbol = computed(() => {
  const chartSymbol = chartInitStore.getChartSymbol(props.id);
  return chartSymbol || "";
});

const getQuotes = (type: "bid" | "ask") => {
  const symbol = nowSymbol.value;
  const digits = symbolInfo.value?.digits;
  if (symbol && quotesStore.qoutes[symbol]) {
    return quotesStore.qoutes[symbol][type].toFixed(digits ?? 2);
  }
  return "-";
};

// 下单手数
const volume = ref<string>("");
// 单笔最小手数
const minVolume = ref<number>(0);
// 单笔最大手数
const maxVolume = ref<number>(0);

// 当前商品
const symbolInfo = ref<ISessionSymbolInfo>();
watchEffect(() => {
  const info = symbolsStore.symbols.find((e) => e.symbol === nowSymbol.value);
  if (info) {
    symbolInfo.value = info;
    minVolume.value = info.volume_min / 100;
    maxVolume.value = info.volume_max / 100;
    volume.value = String(minVolume.value);
  }
});

const step = computed(() => {
  return symbolInfo.value ? symbolInfo.value.volume_step / 100 : 1;
});

const addNum = () => {
  const result = orderStore.volumeAdd(+volume.value, step.value);
  volume.value = String(result);
};
const reduceNum = () => {
  const result = orderStore.volumeSub(
    +volume.value,
    step.value,
    minVolume.value
  );
  volume.value = String(result);
};

const handleInput = () => {
  volume.value = limitdigit(volume.value, 2).toString();
};

const regex = /^-?\d+(\.\d+)?$/;
const valid = async () => {
  const symbols = symbolsStore.symbolsTradeAllow.map((item) => item.symbol);
  if (nowSymbol.value === undefined) {
    return false;
  }
  if (symbols.indexOf(nowSymbol.value) === -1) {
    ElMessage.warning(t("tip.symbolNoAllowTrading"));
    return false;
  }
  const tradAble = await orderStore.getTradAble(nowSymbol.value);
  if (tradAble) {
    return false;
  }
  const value = volume.value;
  if (value === undefined) {
    ElMessage.error(t("tip.volumeRequired"));
    return false;
  }
  if (!regex.test(value)) {
    ElMessage.error(t("tip.numberFormatEror"));
    return false;
  }
  if (+value < minVolume.value) {
    ElMessage.error(`${t("tip.volumeMin")}: ${minVolume.value}`);
    return false;
  }
  if (+value > maxVolume.value) {
    ElMessage.error(`${t("tip.volumeMax")}: ${maxVolume.value}`);
    return false;
  }
  return true;
};
const loading = ref(false);
const addOrder = debounce(
  async (type: 0 | 1) => {
    try {
      if (!nowSymbol.value || !ifCanTrade.value || loading.value) {
        return;
      }
      loading.value = true;
      if (orderStore.state.ifOne === null) {
        dialogStore.openDialog("disclaimersVisible");
        return;
      }
      const v = await valid();
      if (!v) {
        return;
      }
      if (!orderStore.state.ifOne) {
        orderStore.createOrder({
          symbol: nowSymbol.value,
          mode: "confirm",
          type,
          volume: volume.value,
        });
        return;
      }
      const updata: ReqOrderAdd = {
        symbol: nowSymbol.value,
        type,
        volume: +volume.value,
      };
      orderStore.addMarketOrder(updata);
    } finally {
      loading.value = false;
    }
  },
  200,
  { leading: true, trailing: false }
);
</script>
