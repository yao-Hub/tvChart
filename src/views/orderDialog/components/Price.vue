<template>
  <div :key="props.currentSymbolInfo?.symbol">
    <BuySell :showPrice="true" :bid="props.bid" :ask="props.ask" :low="props.low" :high="props.high" @switch-type="switchType"></BuySell>
    <a-divider class="divider"></a-divider>
    <Quantity
      :type="state.type"
      @quantity="quantity"
      @quantity-fail="state.disabledList.Quantity = true"
      :currentSymbolInfo="props.currentSymbolInfo"
      :openPrice="openPrice"
    >
    </Quantity>
    <a-divider class="divider"></a-divider>
    <LossProfit
      @stopLoss="setStopLoss"
      @stopSurplus="setStopSurplus"
      @stopLossFail="state.disabledList.StopLoss = true"
      @stopSurplusFail="state.disabledList.StopSurplus = true"
      orderType="price"
      :transactionType="state.type"
      :bid="props.bid"
      :ask="props.ask" 
      :currentSymbolInfo="props.currentSymbolInfo"
    ></LossProfit>
    <BaseButton
      class="placeOrder"
      type="success"
      @click="addOrders"
      :loading="state.loading"
      :disabled="btnDisabled">
      下单
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { values } from 'lodash';
import { SessionSymbolInfo } from '#/chart/index';
import { ORDER_TYPE } from '@/constants/common';
import { bsType } from '#/order';

import BuySell from './BuySell.vue';
import Quantity from './Quantity.vue';
import LossProfit from './LossProfit.vue';

import { marketOrdersAdd, ReqOrderAdd } from 'api/order/index';

interface Props {
  selectedSymbol: string
  currentSymbolInfo?: SessionSymbolInfo
  ask: number
  bid: number
  high: number
  low: number
}

interface State {
  type: bsType
  volume: string
  sl: string
  tp: string
  loading: boolean
  disabledList: {
    Quantity: boolean
    StopLoss: boolean
    StopSurplus: boolean
  }
}

const state: State = reactive({
  type: 'buy',
  volume: '',
  sl: '',
  tp: '',
  loading: false,
  disabledList: {
    Quantity: false,
    StopLoss: false,
    StopSurplus: false
  }
});

const props = defineProps<Props>();

const emit = defineEmits([ 'success' ]);

const openPrice = computed(() => {
  return state.type === 'buy' ? props.ask : props.bid;
});

const btnDisabled = computed(() => {
  return values(state.disabledList).indexOf(true) > -1;
});

const switchType = (type: bsType) => {
  state.type = type;
}

const quantity = (e: string) => {
  state.volume = e;
  state.disabledList.Quantity = false;
};

const setStopLoss = (e: string) => {
  state.sl = e;
  state.disabledList.StopLoss = false;
}

const setStopSurplus = (e: string) => {
  state.tp = e;
  state.disabledList.StopSurplus = false;
};

const addOrders = async () => {
  try {
    state.loading = true;
    const updata: ReqOrderAdd = {
      symbol: props.selectedSymbol,
      type: ORDER_TYPE.price[state.type],
      volume: +state.volume * 100,
    };
    if (state.sl !== '') {
      updata.sl = +state.sl;
    }
    if (state.tp !== '') {
      updata.tp = +state.tp;
    }
    const res = await marketOrdersAdd(updata);
    if (res.data.action_success) {
      message.success('下单成功');
      emit('success', true)
    } else {
      message.error(`下单失败：${res.data.err_text}`);
    }
  } finally  {
    state.loading = false;
  }
};
</script>

<style lang="scss" scoped>
.divider {
  margin: 5px 0 10px 0;
}
.placeOrder {
  margin-top: 10px;
  width: 100%;
}
</style>