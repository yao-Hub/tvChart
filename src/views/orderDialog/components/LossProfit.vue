<template>
  <div
    class="lossProfit"
    :style="{ flexDirection: props.layout === 'Horizontal' ? 'row' : 'column' }"
  >
    <div :class="[props.inline ? 'inline' : '']">
      <a-checkbox
        v-model:checked="state.stopLoss.disabled"
        v-if="props.titleType === 'checkbox'"
        >止损</a-checkbox
      >
      <span v-else>止损：</span>
      <div :class="[state.stopLoss.errmsg ? 'complete' : '']">
        <a-tooltip
          :title="state.stopLoss.errmsg"
          v-model:open="stopLossTooltipVisabled"
        >
          <a-input
            v-model:value="state.stopLoss.value"
            :disabled="!state.stopLoss.disabled"
            v-bind="props.inputOption"
          >
          </a-input>
        </a-tooltip>
      </div>
    </div>

    <div :class="[props.inline ? 'inline' : '']">
      <a-checkbox
        v-model:checked="state.stopSurplus.disabled"
        v-if="props.titleType === 'checkbox'"
        >止盈</a-checkbox
      >
      <span v-else>止盈：</span>
      <div :class="[state.stopSurplus.errmsg ? 'complete' : '']">
        <a-tooltip
          :title="state.stopSurplus.errmsg"
          v-model:open="stopSurplusTooltipVisabled"
        >
          <a-input
            v-model:value="state.stopSurplus.value"
            :disabled="!state.stopSurplus.disabled"
            v-bind="props.inputOption"
          >
          </a-input>
        </a-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, watchEffect } from "vue";
import { SessionSymbolInfo, OrderType } from "@/types/chart/index";
import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();

interface Props {
  titleType?: "checkbox" | "text";
  layout?: "Horizontal" | "vertical";
  inline?: boolean;
  currentSymbolInfo?: SessionSymbolInfo;
  transactionType: "sell" | "buy"; // 交易类型：买入卖出
  orderType: OrderType;
  bid: number;
  ask: number;
  orderPrice?: string | number;
  inputOption?: Object;
}

const props = withDefaults(defineProps<Props>(), {
  bid: 0,
  ask: 0,
  layout: "Horizontal",
  titleType: "checkbox",
  inline: false,
});

const emit = defineEmits([
  "stopLoss",
  "stopSurplus",
  "stopLossFail",
  "stopSurplusFail",
]);

const state = reactive({
  stopLoss: {
    disabled: props.titleType !== "checkbox",
    value: "",
    errmsg: "",
  },
  stopSurplus: {
    disabled: props.titleType !== "checkbox",
    value: "",
    errmsg: "",
  },
});

const stopLossTooltipVisabled = ref<boolean>(false);
const stopSurplusTooltipVisabled = ref<boolean>(false);

watchEffect(() => {
  stopLossTooltipVisabled.value =
    Boolean(state.stopLoss.errmsg) &&
    orderStore.selectedMenuKey === props.orderType;
  stopSurplusTooltipVisabled.value =
    Boolean(state.stopSurplus.errmsg) &&
    orderStore.selectedMenuKey === props.orderType;
});

watchEffect(() => {
  if (!state.stopLoss.disabled) {
    state.stopLoss.errmsg = "";
    state.stopLoss.value = "";
  }
  if (!state.stopSurplus.disabled) {
    state.stopSurplus.errmsg = "";
    state.stopSurplus.value = "";
  }
});

watch(
  () => [props, state.stopLoss],
  () => {
    if (!props.currentSymbolInfo) {
      return;
    }
    checkStopLoss();
  },
  {
    deep: true,
    flush: "post",
  }
);

watch(
  () => [props, state.stopSurplus],
  () => {
    if (!props.currentSymbolInfo) {
      return;
    }
    checkStopSurplus();
  },
  {
    deep: true,
    flush: "post",
  }
);

const getLead = () => {
  const digits = props.currentSymbolInfo?.digits || 0;
  const stopsLevel = props.currentSymbolInfo?.stops_level || 0;
  const priceVal = props.transactionType === "buy" ? props.ask : props.bid;
  const lead = props.orderType === "price" ? priceVal : +props.orderPrice!;
  const result_1 = lead - (1 / Math.pow(10, +digits)) * +stopsLevel;
  const result_2 = lead + (1 / Math.pow(10, +digits)) * +stopsLevel;
  return {
    result_1,
    result_2,
  };
};

const checkStopLoss = () => {
  const stopLoss = state.stopLoss.value;
  const stopLossDisabled = state.stopLoss.disabled;
  const { result_1, result_2 } = getLead();
  if (props.transactionType === "buy") {
    if (stopLoss !== "" && +stopLoss > result_1 && stopLossDisabled) {
      emit("stopLossFail");
      state.stopLoss.errmsg = `止损价不能大于${result_1}`;
      return;
    }
  }
  if (props.transactionType === "sell") {
    if (stopLoss !== "" && +stopLoss < result_2 && stopLossDisabled) {
      emit("stopLossFail");
      state.stopLoss.errmsg = `止损价不能小于${result_2}`;
      return;
    }
  }
  state.stopLoss.errmsg = "";
  if (state.stopLoss.value) {
    emit("stopLoss", state.stopLoss.value);
  }
};

const checkStopSurplus = () => {
  const stopSurplus = state.stopSurplus.value;
  const stopSurplusDisabled = state.stopSurplus.disabled;
  const { result_1, result_2 } = getLead();
  if (props.transactionType === "buy") {
    if (stopSurplus !== "" && +stopSurplus < result_2 && stopSurplusDisabled) {
      emit("stopSurplusFail");
      state.stopSurplus.errmsg = `止盈价不能小于${result_2}`;
      return;
    }
  }
  if (props.transactionType === "sell") {
    if (stopSurplus !== "" && +stopSurplus > result_1 && stopSurplusDisabled) {
      emit("stopSurplusFail");
      state.stopSurplus.errmsg = `止盈价不能大于${result_1}`;
      return;
    }
  }
  state.stopSurplus.errmsg = "";
  if (state.stopSurplus.value) {
    emit("stopSurplus", state.stopSurplus.value);
  }
};
</script>

<style lang="scss" scoped>
.lossProfit {
  display: flex;
  justify-content: space-between;
  width: 100%;
  .inline {
    display: flex;
    gap: 5px;
    margin: 5px 0;
  }
  .complete {
    position: relative;
  }
  .complete::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background: #9f4747;
    z-index: 9;
    border-radius: 5px;
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>
