<template>
  <div>
    <a-modal
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

          <a-select v-model:value="state.symbol" class="symbolSelect">
            <a-select-option :value="item.symbol" v-for="item in subStore.symbols">{{ item.symbol }}</a-select-option>
          </a-select>
          <a-radio-group v-model:value="state.type" class="radioGroup">
            <a-radio-button value="sell" class="sellRadio">
              <p>卖出</p>
              <p v-if="state.selectedKeys[0] === 'price'">{{ state.quote.bid }}</p>
            </a-radio-button>
            <a-radio-button value="buy" class="buyRadio">
              <p>买入</p>
              <p v-if="state.selectedKeys[0] === 'price'">{{ state.quote.ask }}</p>
            </a-radio-button>
          </a-radio-group>
          <span class="market" v-if="state.selectedKeys[0] === 'price'">
            点差: {{ spread }}; 高: {{ state.newKlineData.high }}; 低: {{ state.newKlineData.low }}
          </span>
          <a-divider class="divider"></a-divider>

          <component
            :is="getComponent()"
            :type="state.type"
            @numEnter="(num: string) => state.marketOrders.volume = num">
          </component>

          <a-divider class="divider"></a-divider>

          <LossProfit
            :transactionType="state.type"
            :currentBuy="state.quote.ask"
            :currentSell="state.quote.bid">
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
import { computed, reactive, watch, markRaw } from 'vue';
import { message } from 'ant-design-vue';

import { useDialog } from '@/store/modules/dialog';
import { useOrder } from '@/store/modules/order';
import { useChartSub } from '@/store/modules/chartSub';
import { useUser } from '@/store/modules/user';

import { STOCKS_DIRECTION } from '@/constants/common';

import { allSymbolQuotes } from 'api/symbols/index';
import { klineHistory } from 'api/kline/index'
import { marketOrdersAdd } from 'api/order/index';

import Price from './components/Price.vue';
import Limit from './components/Limit.vue';
import Stop from './components/Stop.vue';
import StopLimit from './components/StopLimit.vue';
import LossProfit from './components/LossProfit/index.vue';
import BaseButton from '@/components/BaseButton.vue';

const dialogStore = useDialog();
const orderStore = useOrder();
const subStore = useChartSub();
const userStore = useUser();

// 弹窗打开隐藏
const open = computed(() => {
  return dialogStore.orderDialogVisible;
});

// 弹框关闭
const handleCancel = () => {
  dialogStore.closeOrderDialog();
}

type OrderType = 'price' | 'limit' | 'stop' | 'stopLimit';

const state = reactive({
  selectedKeys: ['price'] as OrderType[],
  bodyStyle: {
    backgroundColor: '#525252',
    borderRadius: '8px'
  },
  items: [
    { key: 'price', label: '市价单' },
    // { key: 'limit', label: '限价单' },
    // { key: 'stop', label: '止损单' },
    // { key: 'stopLimit', label: '止损限价单' },
  ],
  itemsEnum: {
    price: markRaw(Price),
    limit: Limit,
    stop: Stop,
    stopLimit: StopLimit
  },
  // 买入 or 卖出
  type: 'buy' as 'buy' | 'sell',
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
  marketOrders: {
    volume: '', // 手数
  }
});

const getComponent = () => {
  return state.itemsEnum[state.selectedKeys[0]];
};


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

// 获取初始化报价
const getQuotes = async () => {
  const res = await allSymbolQuotes();
  const foundQuote = res.data.find(e => e.symbol === state.symbol);
  foundQuote && (state.quote = foundQuote);
};

// 给当前页面的报价赋值
watch(() => orderStore.currentQuote, (newVal) => {
  if (newVal) {
    state.quote = newVal;
  }
}, { immediate: true });

// 初始化最高最低价
const getklineHistory = async () => {
  const { data } = await klineHistory({
    period_type: '1',
    symbol: orderStore.currentSymbol,
    count: 1,
    limit_ctm: Math.floor(Date.now() / 1000)
  });
  state.newKlineData = data[0];
};

// 给最高最低价赋值
watch(() => orderStore.currentKline, (newVal) => {
  if (newVal) {
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

// interface Updata {
//   server:	string // 经纪商交易线路编码
//   login:	number // 账户
//   token:	string // 登录成功得到的token
//   orders:	[] // 订单列表
//   symbol:	string // 品种
//   type:	number // 操作方向。0=buy，1=sell
//   volume:	number // 手数。1=0.01手
//   sl?:	number // 止损价。1=0.01手
//   tp?:	number // 止盈价。1=0.01手
// }


const addOrders = async () => {
  const orderType = state.selectedKeys[0];
  switch(orderType) {
    case 'price':
      const updata = {
        login: userStore.account.login,
        orders: [],
        symbol: state.symbol,
        type: STOCKS_DIRECTION[state.type],
        volume: Number(state.marketOrders.volume) * 100,
        comment: state.remark
        // sl: '',
        // tp: ''
      };
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