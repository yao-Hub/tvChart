<template>
  <div style="display: flex; gap: 5px; align-items: center">
    <span style="min-width: 50px">{{ bid }}</span>
    <span @click="creatOrder('sell')" style="cursor: pointer">sell</span>
    <div
      style="
        display: flex;
        align-items: center;
        border: 1px solid #525252;
        padding: 0 5px;
        border-radius: 3px;
      "
    >
      <UpOutlined style="font-size: 12px; cursor: pointer" @click="addNum" />
      <input type="text" style="width: 50px; border: none" v-model="volume" />
      <DownOutlined
        style="font-size: 12px; cursor: pointer"
        @click="reduceNum"
      />
    </div>
    <span @click="creatOrder('buy')" style="cursor: pointer">buy</span>
    <span style="min-width: 50px">{{ ask }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { UpOutlined, DownOutlined } from "@ant-design/icons-vue";
import { useChartSub } from "@/store/modules/chartSub";
import { round } from "utils/common/index";
import { marketOrdersAdd, ReqOrderAdd } from "api/order/index";
import { ORDER_TYPE } from "@/constants/common";

const subStore = useChartSub();

import { useOrder } from "@/store/modules/order";
import { message } from "ant-design-vue";
const orderStore = useOrder();

interface Props {
  symbol: string;
}
const props = defineProps<Props>();

const bid = computed(() => {
  return getQuotes("bid", props.symbol);
});

const ask = computed(() => {
  return getQuotes("ask", props.symbol);
});

const getQuotes = (type: "bid" | "ask", symbol: string) => {
  if (orderStore.currentQuotes[symbol]) {
    return orderStore.currentQuotes[symbol][type];
  }
  return "-";
};

// 当前品种
const symbolInfo = computed(() => {
  return subStore.symbols.find((e) => e.symbol === props.symbol);
});

// 单笔最小手数
const minVolume = computed(() => {
  const symbol = symbolInfo.value;
  if (symbol) {
    const volume_min = (symbol.volume_min / 100).toString();
    return volume_min;
  }
  return "0";
});

// 单笔最大手数
const maxVolume = computed(() => {
  const symbol = symbolInfo.value;
  if (symbol) {
    const volume_max = (symbol.volume_max / 100).toString();
    return volume_max;
  }
  return "0";
});

const step = computed(() => {
  return symbolInfo.value ? symbolInfo.value.volume_step : 1;
});

const volume = ref<string>(minVolume.value);

const addNum = () => {
  volume.value = String(round(+volume.value + step.value, 2));
};
const reduceNum = () => {
  volume.value = String(round(+volume.value - step.value, 2));
};

const regex = /^-?\d+(\.\d+)?$/;
const valid = () => {
  const value = volume.value;
  if (!regex.test(value)) {
    message.error("请输入正确的数字格式");
    return false;
  }
  if (value < minVolume.value) {
    message.error(`不能小于单笔最小手数${minVolume.value}`);
    return false;
  }
  if (value > maxVolume.value) {
    message.error(`不能大于单笔最大手数${maxVolume.value}`);
    return false;
  }
  return true;
};
const creatOrder = async (type: 'sell' | 'buy') => {
  const v = valid();
  if (v) {
    const updata: ReqOrderAdd = {
      symbol: props.symbol,
      type: ORDER_TYPE.price[type],
      volume: +volume.value * 100,
    };
    const res = await marketOrdersAdd(updata);
    if (res.data.action_success) {
      message.success("下单成功");
      return;
    }
    message.error(`下单失败：${res.data.err_text}`);
  }
};
</script>
