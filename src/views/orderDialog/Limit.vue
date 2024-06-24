<template>
  <div>
    <BuySell :showPrice="true" :bid="props.bid" :ask="props.ask" :low="props.low" :high="props.high" @switch-type="switchType"></BuySell>
    <a-divider class="divider"></a-divider>
    <div class="center">
      <EntryPrice
        :currentBuy="props.ask"
        :currentSell="props.bid"
        :transactionType="state.type"
        @entryPrice="e => state.order_price = e">
      </EntryPrice>
      <Quantity
        :type="state.type"
        @quantity="quantity"
        @quantity-fail="quantityFail"
        :selectedSymbol="props.selectedSymbol"
        :tradeAllowSymbols="props.tradeAllowSymbols"
        :openPrice="openPrice"
      >
      </Quantity>
    </div>
    <a-divider class="divider"></a-divider>
    <LossProfit
      @stopLoss="e => state.sl = e"
      @stopSurplus="e => state.tp = e"></LossProfit>
    <BaseButton class="placeOrder" type="success" @click="addOrders" :loading="state.loading" :disabled="state.disabled">下单</BaseButton>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import moment from 'moment';
import { SessionSymbolInfo } from '@/types/chart/index';
import { bsType, BUY_SELL_TYPE } from '@/constants/common';

import BuySell from './components/BuySell.vue';
import Quantity from './components/Quantity.vue';
import LossProfit from './components/LossProfit.vue';
import EntryPrice from './components/EntryPrice.vue';

import { pendingOrdersAdd, reqPendingOrdersAdd } from 'api/order/index';

interface Props {
  selectedSymbol: string
  tradeAllowSymbols: SessionSymbolInfo[]
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
  order_price: string
  disabled: boolean
}

const state: State = reactive({
  type: 'buy',
  volume: '',
  sl: '',
  tp: '',
  loading: false,
  order_price: '',
  disabled: false
});

const props = defineProps<Props>();

const emit = defineEmits([ 'success' ]);

const openPrice = computed(() => {
  return state.type === 'buy' ? props.ask : props.bid;
});

const switchType = (type: bsType) => {
  state.type = type;
}

const quantity = (e: string) => {
  state.volume = e;
  state.disabled = false;
};

const quantityFail =() => {
  state.disabled = true;
};

const addOrders = async () => {
  try {
    state.loading = true;
    const updata: reqPendingOrdersAdd = {
      symbol: props.selectedSymbol,
      type: BUY_SELL_TYPE.limit[state.type],
      volume: +state.volume * 100,
      order_price: +state.order_price,
      time_expiration: moment().add(10, 'minutes').unix(),
    };
    if (state.sl !== '') {
      updata.sl = +state.sl;
    }
    if (state.tp !== '') {
      updata.tp = +state.tp;
    }
    const res = await pendingOrdersAdd(updata);
    if (res.data.action_success) {
      message.success('下单成功');
      emit('success', true)
    } else {
      message.error('下单失败');
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
.center {
  display: flex;
  justify-content: space-between;
}
.placeOrder {
  margin-top: 10px;
  width: 100%;
}
</style>