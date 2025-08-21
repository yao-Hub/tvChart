<template>
  <div :style="styles.addOrder">
    <div :style="styles.area">
      <div :style="wordStyle('sell')">
        {{ getQuotes("bid") }}
      </div>
      <div
        :style="btnStyle('sell')"
        @click="addOrder(1)"
        :title="`${t('quickTrade.clickSell')}(${t('quickTrade.title')})`"
      >
        {{ t("quickTrade.sell") }}
      </div>
    </div>
    <div
      :style="{ ...inputAreaStyle }"
      @mouseenter="ifHover = true"
      @mouseleave="ifHover = false"
    >
      <BaseImg
        :style="styles.icon"
        iconName="caretDown"
        :theme="colorScheme"
        @click="reduceNum"
      />
      <input
        :style="{ ...styles.input }"
        :id="`${props.id}_input`"
        v-model="volume"
        @input="handleInput"
        @blur="handleBlur"
      />
      <BaseImg
        iconName="caretUp"
        :style="styles.icon"
        :theme="colorScheme"
        @click="addNum"
      />
    </div>
    <div :style="styles.area">
      <div
        :style="btnStyle('buy')"
        @click="addOrder(0)"
        :title="`${t('quickTrade.clickBuy')}(${t('quickTrade.title')})`"
      >
        {{ t("quickTrade.buy") }}
      </div>
      <div :style="wordStyle('buy')">
        {{ getQuotes("ask") }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from "element-plus";
import { computed, ref, watchEffect, CSSProperties, onMounted } from "vue";
import { debounce } from "lodash";
import Decimal from "decimal.js";

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
import { useStorage } from "@/store/modules/storage";
const { t } = useI18n();

const chartInitStore = useChartInit();
const dialogStore = useDialog();
const orderStore = useOrder();
const themeStore = useTheme();
const symbolsStore = useSymbols();
const quotesStore = useQuotes();

// 样式
const styles: Record<string, CSSProperties> = {
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
    textAlign: "center",
    background: "inherit",
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
    minWidth: "51px",
    color: "#fff",
  },
};

const wordDownColor = computed(() => {
  return themeStore.getUpDownColor("downHoverColor");
});
const wordUpColor = computed(() => {
  return themeStore.getUpDownColor("upHoverColor");
});
const wordStyle = (type: "buy" | "sell") => {
  return {
    ...styles.word,
    backgroundColor: type === "sell" ? wordDownColor.value : wordUpColor.value,
    borderRadius: type === "sell" ? "2px 0 0 2px" : "0 2px 2px 0",
  };
};

const btnDownColor = computed(() => {
  return themeStore.getUpDownColor("downColor");
});
const btnUpColor = computed(() => {
  return themeStore.getUpDownColor("upColor");
});

const btnStyle = (type: "buy" | "sell") => {
  return {
    ...styles.btn,
    backgroundColor: type === "sell" ? btnDownColor.value : btnUpColor.value,
    opacity: ifCanTrade.value && !loading.value ? 1 : 0.5,
    cursor: ifCanTrade.value && !loading.value ? "pointer" : "not-allowed",
  };
};

const colorScheme = computed(() => {
  const scheme = themeStore.iframesColorScheme[props.id];
  return scheme || themeStore.systemTheme;
});

const ifHover = ref(false);
const inputAreaStyle = computed<CSSProperties>(() => {
  const primary = colorScheme.value === "light" ? "#e28602" : "#f4b201";
  const color = colorScheme.value === "light" ? "#000" : "#fff";
  const borderColor = colorScheme.value === "light" ? "#DEE2E9" : "#2C2F35";
  const backgroundColor = colorScheme.value === "light" ? "#fff" : "#000";
  return {
    ...styles.inputArea,
    color,
    backgroundColor,
    borderColor: ifHover.value ? primary : borderColor,
    borderRadius: "2px",
    boxSizing: "border-box",
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
  if (symbol && symbolInfo.value && quotesStore.qoutes[symbol]) {
    const digits = symbolInfo.value.digits;
    const result = quotesStore.qoutes[symbol][type];
    return new Decimal(result).toFixed(digits || 2);
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
    minVolume.value = info.volume_step / 100;
    maxVolume.value = info.volume_max / 100;
    volume.value = String(minVolume.value);
  }
});

const step = computed(() => {
  return symbolInfo.value ? symbolInfo.value.volume_step / 100 : 1;
});

onMounted(() => {
  const chartVolumes = useStorage().getItem("chartVolumes");
  if (chartVolumes && chartVolumes[props.id]) {
    volume.value = chartVolumes[props.id];
  }
});

const addNum = () => {
  const result = orderStore.volumeAdd(volume.value, step.value);
  volume.value = String(result);
};
const reduceNum = () => {
  const result = orderStore.volumeSub(
    volume.value,
    step.value,
    minVolume.value
  );
  volume.value = String(result);
};

const handleInput = () => {
  volume.value = limitdigit(volume.value, 2).toString();
};

const handleBlur = () => {
  if (volume.value === "") {
    volume.value = String(minVolume.value);
  }
};

const regex = /^-?\d+(\.\d+)?$/;
const valid = async () => {
  if (nowSymbol.value === undefined) {
    return false;
  }
  const ifTrader = orderStore.ifCanTrader(nowSymbol.value);
  if (!ifTrader) {
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
      // 记忆手数
      const storageChartVolumes = useStorage().getItem("chartVolumes") || {};
      storageChartVolumes[props.id] = volume;
      useStorage().setItem("chartVolumes", storageChartVolumes);

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
