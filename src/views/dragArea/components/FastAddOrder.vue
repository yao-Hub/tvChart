<template>
  <div class="orderBtn">
    <div class="area">
      <div class="price sellword">{{ bid }}</div>
      <div class="btn sellBtn" @click="creatOrder('sell')">SELL</div>
    </div>
    <div class="input">
      <UpOutlined class="icon" @click="addNum" />
      <input type="text" v-model="volume" />
      <DownOutlined class="icon" @click="reduceNum"/>
    </div>
    <div class="area">
      <div class="btn buybtn" @click="creatOrder('buy')">BUY</div>
      <div class="price buyword">{{ ask }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from "vue";
import { UpOutlined, DownOutlined } from "@ant-design/icons-vue";
import { useChartSub } from "@/store/modules/chartSub";
import { round } from "utils/common/index";
import { marketOrdersAdd, ReqOrderAdd } from "api/order/index";
import { ORDER_TYPE } from "@/constants/common";
import { SessionSymbolInfo } from "@/types/chart/index";
import { useChartInit } from "@/store/modules/chartInit";
import { useDialog } from "@/store/modules/dialog";

const subStore = useChartSub();
const chartInitStore = useChartInit();
const dialogStore = useDialog();

import { useOrder } from "@/store/modules/order";
import { message } from "ant-design-vue";
const orderStore = useOrder();

interface Props {
  symbol: string;
  id: string
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
const volume = ref<string>();
// 单笔最小手数
const minVolume = ref<string>('0');
// 单笔最大手数
const maxVolume = ref<string>('0');

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
  return symbolInfo.value ? symbolInfo.value.volume_step : 1;
});

const addNum = () => {
  volume.value = String(round(+(volume.value || 0) + step.value, 2));
};
const reduceNum = () => {
  volume.value = String(round(+(volume.value || 0) - step.value, 2));
};

const regex = /^-?\d+(\.\d+)?$/;
const valid = () => {
  const value = volume.value;
  if (value === undefined) {
    message.error("请输入手数");
    return false;
  }
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
      message.success("下单成功");
      return;
    }
    message.error(`下单失败：${res.data.err_text}`);
  }
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.orderBtn {
  display: flex;
  height: 18px;
  width: 267px;
  justify-content: space-between;
  .area {
    display: flex;
  }
}
.price, .btn {
  color: #fff;
  font-size: 12px;
  height: 18px;
  text-align: center;
  line-height: 18px;
  padding: 0 5px;
}
.price {
  width: 51px;
}
.btn {
  cursor: pointer;
}
.sellword {
  @include background_color('upHover');
}
.sellBtn {
  @include background_color('up');
}
.buybtn {
  @include background_color('down');
}
.buyword {
  @include background_color('downHover');
} 
.input {
  display: flex;
  border: 1px solid;
  @include border_color("border");
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  flex: 1;
  height: 100%;
  @include background_color('background-component');
}
.icon {
  font-size: 12px;
  scale: 0.5;
  width: 12px;
  height: 12px;
}
input {
  border: none;
  width: 50px;
  height: 14px;
  text-align: center;
}
</style>
