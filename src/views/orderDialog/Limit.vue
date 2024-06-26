<template>
  <div>
    <BuySell :showPrice="true" :bid="props.bid" :ask="props.ask" :low="props.low" :high="props.high" @switch-type="switchType"></BuySell>
    <a-divider class="divider"></a-divider>
    <div class="center">
      <EntryPrice
        orderType="limit"
        :transactionType="state.type"
        :bid="props.bid"
        :ask="props.ask"
        :currentSymbolInfo="props.currentSymbolInfo"
        @entryPrice="entryPrice"
        @entryPriceFail="state.disabledList.EntryPrice = true">
      </EntryPrice>
      <Quantity
        :type="state.type"
        @quantity="quantity"
        @quantity-fail="state.disabledList.Quantity = true"
        :openPrice="openPrice"
        :currentSymbolInfo="props.currentSymbolInfo"
      >
      </Quantity>
    </div>
    <DueDate
      @dueDateFail="state.disabledList.DueDate = true"
      @dueDate="dueDate">
    </DueDate>
    <a-divider class="divider"></a-divider>
    <LossProfit
      @stopLoss="setStopLoss"
      @stopSurplus="setStopSurplus"
      @stopLossFail="state.disabledList.StopLoss = true"
      @stopSurplusFail="state.disabledList.StopSurplus = true"
      orderType="limit"
      :orderPrice="state.order_price"
      :transactionType="state.type"
      :bid="props.bid"
      :ask="props.ask"
      :currentSymbolInfo="props.currentSymbolInfo"
      >
    </LossProfit>
    <BaseButton class="placeOrder" type="success" @click="addOrders" :loading="state.loading" :disabled="btnDisabled">下单</BaseButton>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { values } from 'lodash';
import { SessionSymbolInfo } from '#/chart/index';
import { BUY_SELL_TYPE } from '@/constants/common';
import { bsType } from '#/order';

import BuySell from './components/BuySell.vue';
import Quantity from './components/Quantity.vue';
import LossProfit from './components/LossProfit.vue';
import EntryPrice from './components/EntryPrice.vue';
import DueDate from './components/DueDate.vue';

import { pendingOrdersAdd, reqPendingOrdersAdd } from 'api/order/index';

interface Props {
  currentSymbolInfo: SessionSymbolInfo
  selectedSymbol: string
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
  disabledList: Record<string, boolean>
  dueDate: number | string
}

const state: State = reactive({
  type: 'buy',
  volume: '',
  sl: '',
  tp: '',
  loading: false,
  order_price: '',
  dueDate: '',
  disabledList: {
    EntryPrice: false,
    Quantity: false,
    DueDate: false,
    StopLoss: false,
    StopSurplus: false,
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

// 入场价
const entryPrice = (e: string) => {
  state.order_price = e;
  state.disabledList.EntryPrice = false;
};

// 手数
const quantity = (e: string) => {
  state.volume = e;
  state.disabledList.Quantity = false;
};

// 止亏
const setStopLoss = (e: string) => {
  state.sl = e;
  state.disabledList.StopLoss = false;
}

// 止盈
const setStopSurplus = (e: string) => {
  state.tp = e;
  state.disabledList.StopSurplus = false;
};

// 到期日
const dueDate = (e: string | number) => {
  state.dueDate = e;
  state.disabledList.DueDate = false;
};

const addOrders = async () => {
  try {
    state.loading = true;
    const updata: reqPendingOrdersAdd = {
      symbol: props.selectedSymbol,
      type: BUY_SELL_TYPE.limit[state.type],
      volume: +state.volume * 100,
      order_price: +state.order_price,
    };
    if (state.dueDate) {
      updata.time_expiration = +state.dueDate;
    }
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