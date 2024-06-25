<template>
  <div class="lossProfit">
    <div>
      <a-checkbox v-model:checked="state.stopLoss.disabled">止损</a-checkbox>
      <div :class="[state.stopLoss.errmsg ? 'complete' : '']">
        <a-tooltip :title="state.stopLoss.errmsg" :open="stopLossTooltipVisabled">
          <a-input
            v-model:value="state.stopLoss.value"
            :disabled="!state.stopLoss.disabled">
          </a-input>
        </a-tooltip>
      </div>
    </div>

    <div>
      <a-checkbox v-model:checked="state.stopSurplus.disabled">止盈</a-checkbox>
      <div :class="[state.stopSurplus.errmsg ? 'complete' : '']">
        <a-tooltip :title="state.stopSurplus.errmsg" :open="stopSurplusTooltipVisabled">
          <a-input
            v-model:value="state.stopSurplus.value"
            :disabled="!state.stopSurplus.disabled">
          </a-input>
        </a-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed, watchEffect } from 'vue';
import { debounce } from 'lodash';
import { SessionSymbolInfo } from '@/types/chart/index';
import { useOrder } from '@/store/modules/order';
const orderStore = useOrder();

interface Props {
  currentSymbolInfo?: SessionSymbolInfo
  transactionType: 'sell' | 'buy' // 交易类型：买入卖出
  orderType: 'limit' | 'stopLimit' | 'stop' | 'price'
  bid: number
  ask: number
  orderPrice?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  bid: 0,
  ask: 0,
});

const emit = defineEmits([ 'stopLoss', 'stopSurplus', 'lossProfitFail' ]);

const state = reactive({
  stopLoss: {
    disabled: false,
    value: '',
    errmsg: '',
  },
  stopSurplus: {
    disabled: false,
    value: '',
    errmsg: '',
  },
});

const stopLossTooltipVisabled = computed(() => {
  return Boolean(state.stopLoss.errmsg) && orderStore.selectedMenuKey === props.orderType;
});
const stopSurplusTooltipVisabled = computed(() => {
  return Boolean(state.stopSurplus.errmsg) && orderStore.selectedMenuKey === props.orderType;
});

watchEffect(() => {
  if (!state.stopLoss.disabled) {
    state.stopLoss.errmsg = '';
    state.stopLoss.value = '';
  }
  if (!state.stopSurplus.disabled) {
    state.stopSurplus.errmsg = '';
    state.stopSurplus.value = '';
  }
});

watch(() => [ props, state.stopLoss, state.stopSurplus ], () => {
  if (!props.currentSymbolInfo || (!state.stopLoss.disabled && !state.stopSurplus.disabled)) {
    return;
  }
  debouncedCheckResult();
}, {
  deep: true,
  flush: 'post'
});

const debouncedCheckResult = debounce(() => {
  checkResult();
}, 100);

const checkResult = () => {
  const digits = props.currentSymbolInfo?.digits || 0;
  const stopsLevel = props.currentSymbolInfo?.stops_level || 0;
  const stopLoss = state.stopLoss.value;
  const stopSurplus = state.stopSurplus.value;
  const stopLossDisabled = state.stopLoss.disabled;
  const stopSurplusDisabled = state.stopSurplus.disabled;

  const priceVal = props.transactionType === 'buy' ? props.ask : props.bid;
  const lead = props.orderType === 'price' ?  priceVal : +props.orderPrice!;
  const result_1 = lead - 1 / Math.pow(10, +digits) * +stopsLevel;
  const result_2 =  lead + 1 / Math.pow(10, +digits) * +stopsLevel;
  if (props.transactionType === 'buy') {
    if (+stopLoss > result_1 && stopLossDisabled) {
      emit('lossProfitFail');
      state.stopLoss.errmsg = `止损价不能大于${result_1}`;
      return;
    }
    if (+stopSurplus < result_2 && stopSurplusDisabled) {
      emit('lossProfitFail');
      state.stopSurplus.errmsg = `止盈价不能小于${result_2}`;
      return;
    }
  }
  if (props.transactionType === 'sell') {
    if (+stopLoss < result_2 && stopLossDisabled) {
      emit('lossProfitFail');
      state.stopLoss.errmsg = `止损价不能小于${result_2}`;
      return;
    }
    if (+stopSurplus > result_1 && stopSurplusDisabled) {
      emit('lossProfitFail');
      state.stopSurplus.errmsg = `止盈价不能大于${result_1}`;
      return;
    }
  }
  state.stopLoss.errmsg = '';
  state.stopSurplus.errmsg = '';
  if (state.stopLoss.value) {
    emit('stopLoss', state.stopLoss.value);
  }
  if (state.stopSurplus.value) {
    emit('stopSurplus', state.stopSurplus.value);
  }
};

</script>

<style lang="scss" scoped>
.lossProfit {
  display: flex;
  justify-content: space-between;
  width: 100%;
  .complete {
    position: relative;
  }
  .complete::before {
    content: '';
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