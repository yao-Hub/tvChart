<template>
  <div>
    <BuySell :showPrice="true" :bid="props.bid" :ask="props.ask" :low="props.low" :high="props.high" @switch-type="switchType"></BuySell>
    <a-divider class="divider"></a-divider>
    <div class="center">
      <EntryPrice
        distanceTitle="价差"
        :currentBuy="props.ask"
        :currentSell="props.bid"
        :transactionType="state.type">
      </EntryPrice>
      <Quantity
        :type="state.type"
        @quantity="(e) => state.volume = e"
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
    <BaseButton class="placeOrder" type="success" @click="addOrders">下单</BaseButton>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { SessionSymbolInfo } from '@/types/chart/index';
import { bsType, BUY_SELL_TYPE } from '@/constants/common';

import { useUser } from '@/store/modules/user';
import BuySell from './components/BuySell.vue';
import Quantity from './components/Quantity.vue';
import LossProfit from './components/LossProfit.vue';
import EntryPrice from './components/EntryPrice.vue';

import { marketOrdersAdd, ReqOrderAdd } from 'api/order/index';

const userStore = useUser();

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
}

const state: State = reactive({
  type: 'buy',
  volume: '',
  sl: '',
  tp: '',
});

const props = defineProps<Props>();

const emit = defineEmits([ 'success' ]);

const openPrice = computed(() => {
  return state.type === 'buy' ? props.ask : props.bid;
});

const switchType = (type: bsType) => {
  state.type = type;
}

const addOrders = async () => {
  const updata: ReqOrderAdd = {
    login: userStore.account.login,
    symbol: props.selectedSymbol,
    type: BUY_SELL_TYPE.stop[state.type],
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
    message.error('下单失败');
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