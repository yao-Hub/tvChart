<template>
  <div>
    <a-modal
      :width="700"
      v-model:open="open"
      :title="title"
      @cancel="handleCancel"
      :bodyStyle="state.bodyStyle"
      :footer="null">
      <div class="main">
        <a-menu
          class="left"
          v-model:selectedKeys="state.selectedKeys"
          mode="inline"
          :items="state.items"
        ></a-menu>
        <div class="right">
          <div class="title">新{{ title }}</div>
          <a-divider class="divider"></a-divider>

          <a-select v-model:value="state.symbol" class="symbolSelect" @change="symbolChange">
            <a-select-option :value="item.symbol" v-for="item in tradeAllowSymbols">{{ item.symbol }}</a-select-option>
          </a-select>
          <a-radio-group v-model:value="state.type" class="radioGroup">
            <a-radio-button value="sell" class="sellRadio">
              <p>卖出</p>
              <p v-if="ifPrice">{{ state.quote.bid }}</p>
            </a-radio-button>
            <a-radio-button value="buy" class="buyRadio">
              <p>买入</p>
              <p v-if="ifPrice">{{ state.quote.ask }}</p>
            </a-radio-button>
          </a-radio-group>
          <span class="market" v-if="ifPrice">
            点差: {{ spread }}; 高: {{ state.newKlineData.high }}; 低: {{ state.newKlineData.low }}
          </span>
          <a-divider class="divider"></a-divider>

          <div class="center">
            <EntryPrice
              v-if="!ifPrice"
              :currentBuy="state.quote.ask"
              :currentSell="state.quote.bid"
              :transactionType="state.type">
            </EntryPrice>
            <Quantity
              :type="state.type"
              @quantity="(num: string) => state.ordersUodata.volume = num"
              :selectedSymbol="state.symbol"
              :tradeAllowSymbols="tradeAllowSymbols"
              :openPrice="state.type === 'buy' ? state.quote.ask : state.quote.bid"
            >
            </Quantity>
          </div>

          <a-divider class="divider"></a-divider>

          <LossProfit
            :transactionType="state.type"
            :currentBuy="state.quote.ask"
            :currentSell="state.quote.bid"
            :selectedSymbol="state.symbol"
            :tradeAllowSymbols="tradeAllowSymbols"
            :volume="+state.ordersUodata.volume"
            @stopLoss="(e) => state.ordersUodata.sl = e"
            @stopSurplus="(e) => state.ordersUodata.tp = e">
          </LossProfit>
          <a-divider class="divider"></a-divider>

          <a-textarea
            v-model:value="state.remark"
            placeholder="备注"
            :auto-size="{ minRows: 3, maxRows: 5 }"
            show-count :maxlength="100"
          />
          <BaseButton class="placeOrder" type="success" @click="addOrders">下单</BaseButton>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';
import { message } from 'ant-design-vue';

import { useDialog } from '@/store/modules/dialog';
import { useOrder } from '@/store/modules/order';
import { useChartSub } from '@/store/modules/chartSub';
import { useUser } from '@/store/modules/user';

import { subscribeSocket, unsubscribeSocket } from 'utils/socket/operation';
import { STOCKS_DIRECTION } from '@/constants/common';

import { allSymbolQuotes } from 'api/symbols/index';
import { klineHistory } from 'api/kline/index'
import { marketOrdersAdd, ReqOrderAdd } from 'api/order/index';

import EntryPrice from './components/EntryPrice.vue';
import Quantity from './components/Quantity.vue';
import LossProfit from './components/LossProfit/index.vue';
import BaseButton from '@/components/BaseButton.vue';

const dialogStore = useDialog();
const orderStore = useOrder();
const subStore = useChartSub();
const userStore = useUser();

type OrderType = 'price' | 'limit' | 'stop' | 'stopLimit';
type bsType = 'buy' | 'sell';

const state = reactive({
  selectedKeys: ['price'] as OrderType[],
  bodyStyle: {
    backgroundColor: '#525252',
    borderRadius: '8px'
  },
  items: [
    { key: 'price', label: '市价单' },
    { key: 'limit', label: '限价单' },
    // { key: 'stop', label: '止损单' },
    // { key: 'stopLimit', label: '止损限价单' },
  ],
  // 买入 or 卖出
  type: 'buy' as bsType,
  symbol: '',
  // 报价
  quote: {
    ask: 0,
    bid: 0,
    ctm_ms: 0,
    ctm: 0,
    symbol: '',
    server: 'upway-live',
  },
  // k线最新数据（最高最低价）
  newKlineData: {
    close: 0,
    ctm: 0,
    date_time: '',
    high: 0,
    low: 0,
    open: 0,
    volume: 0
  },
  remark: '',
  ordersUodata: {
    volume: '', // 手数
    sl: '', // 止损价
    tp: '', // 止盈价
  },
  socketList: [] as string[]
});

// 弹窗打开隐藏
const open = computed(() => {
  return dialogStore.orderDialogVisible;
});

// 弹框关闭
const handleCancel = () => {
  // 取消订阅
  const unsubList = state.socketList.filter(e => e !== orderStore.currentSymbol);
  unsubList.forEach(item => {
    unsubscribeSocket({ resolution: '1', symbol: item });
  });
  dialogStore.closeOrderDialog();
}

const ifPrice = computed(() => {
  return state.selectedKeys[0] === 'price';
});

// 可交易品种
const tradeAllowSymbols = computed(() => {
  return subStore.symbols.filter(e => e.trade_allow === 1);
});

// 弹框标题
const title = computed(() => {
  const item = state.items.find(e => e.key === state.selectedKeys[0]);
  return item?.label
});

// 点差 点差是买价和卖价的差。
const spread = computed(() => {
  const ask = state.quote.ask;
  const bid = state.quote.bid;
  return Math.abs(ask - bid).toFixed(2);
});

// 给当前页面的报价赋值
watch(() => orderStore.currentQuote, (newVal) => {
  if (newVal && newVal.symbol === state.symbol) {
    state.quote = newVal;
  }
}, { immediate: true });

// 给最高最低价赋值
watch(() => orderStore.currentKline, (newVal) => {
  if (newVal && newVal.symbol === state.symbol) {
    state.newKlineData = newVal;
  }
}, { immediate: true });

// 弹窗初始化
watch(open, (newVal) => {
  if (newVal) {
    state.symbol = orderStore.currentSymbol;
    getklineHistory();
    getQuotes();
  }
});

// 获取初始化报价
const getQuotes = async () => {
  const res = await allSymbolQuotes();
  const foundQuote = res.data.find(e => e.symbol === state.symbol);
  foundQuote && (state.quote = foundQuote);
};

// 初始化最高最低价
const getklineHistory = async () => {
  const { data } = await klineHistory({
    period_type: '1',
    symbol: state.symbol,
    count: 1,
    limit_ctm: Math.floor(Date.now() / 1000)
  });
  state.newKlineData = data[0];
};

// 品种变化
const symbolChange = (value: string) => {
  if (state.socketList.indexOf(value) === -1) {
    state.socketList.push(value);
  }
  subscribeSocket({ resolution: '1', symbol: value });
  getklineHistory();
  getQuotes();
};

const addOrders = async () => {
  const orderType = state.selectedKeys[0];
  switch(orderType) {
    case 'price':
      const { sl, tp, volume } = state.ordersUodata;
      const updata: ReqOrderAdd = {
        login: userStore.account.login,
        symbol: state.symbol,
        type: STOCKS_DIRECTION[state.type],
        volume: +volume * 100,
        comment: state.remark,
      };
      if (sl !== '') {
        updata.sl = +sl;
      }
      if (tp !== '') {
        updata.tp = +tp;
      }
      const res = await marketOrdersAdd(updata);
      if (res.data.action_success) {
        message.success('下单成功');
        orderStore.refreshOrderArea = true;
        handleCancel();
      } else {
        message.error('下单失败');
      }
      break;
    default:
      break;
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/_handle.scss';
.divider {
  margin: 5px 0 10px 0;
}
.main {
  display: flex;
  width: 100%;
  padding: 3px;
}
.left {
  max-width: 129px !important;
  min-width: 129px !important;
}
.right {
  flex: 1;
  padding: 10px;
  .title {
    font-size: 21px;
  }
  .radioGroup {
    display: flex;
    gap: 8px;
    .buyRadio {
      color: #19b52d;
    }
    .sellRadio {
      color: #dd6600;
    }
  }
  .symbolSelect {
    width: 100%;
    margin: 8px 0;
  }
  .market {
    display: block;
    text-align: center;
    margin: 8px 0;
  }
  .placeOrder {
    margin-top: 10px;
    width: 100%;
  }
  .center {
    display: flex;
    justify-content: space-between;
  }
}
:deep(.ant-menu) {
  border-radius: 8px 0 0 8px;
}
:deep(.ant-menu-inline .ant-menu-item) {
  width: calc(100% - 3px);
  border-radius: 8px 0 0 8px;
  color: #fff;
}
:deep(.ant-menu-item-selected) {
  background-color: #525252;
}
.ant-radio-button-wrapper {
  height: auto;
  flex: 1;
  text-align: center;
}
.ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):first-child {
  border-color: #dd6600;
}
.ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):last-child {
  border-color: #19b52d;
}
.ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)::before,
.ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)::before {
  background-color: #19b52d;
}
</style>