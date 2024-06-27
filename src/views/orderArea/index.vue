<template>
  <div class="orderArea">
    <a-tabs v-model:activeKey="activeKey" type="card">
      <a-tab-pane v-for="item in state.menu" :key="item.key" :tab="item.label">
        <div class="container">
          <a-table style="flex: 1;" sticky :dataSource="state.dataSource[activeKey]" :columns="state.columns[item.key]" :pagination="false" size="small">
            <template #bodyCell="{ record, column, index }">
              <template v-if="column.dataIndex === 'time_setup'">{{ formatTime(record.time_setup) }}</template>
              <template v-if="column.dataIndex === 'time_expiration'">{{ formatTime(record.time_expiration) }}</template>
              <template v-if="column.dataIndex === 'time_done'">{{ formatTime(record.time_done) }}</template>
              <template v-if="column.dataIndex === 'volume'">{{ record.volume / 100 }}手</template>
              <template v-if="column.dataIndex === 'type'">{{ $t(`order.${getType(record.type)}`) }}</template>
              <template v-if="column.dataIndex === 'orderType'">{{ $t(`order.type.${getOrderType(record.type)}`) }}</template>
              <template v-if="column.dataIndex === 'now_price'">{{ getNowPrice(record, index) }}</template>
              <template v-if="column.dataIndex === 'profit' && activeKey !== 'transactionHistory'">{{ getProfit(record, index) }}</template>
              <template v-if="column.dataIndex === 'distance'">{{ getDistance(record) }}</template>
              <template v-if="column.dataIndex === 'positionAction'">
                <a-tooltip title="平仓">
                  <a-button :icon="h(CloseOutlined)" size="small" @click="orderClose(record)"></a-button>
                </a-tooltip>
              </template>
              <template v-if="column.dataIndex === 'orderAction'">
                <a-tooltip title="撤销">
                  <a-button :icon="h(CloseOutlined)" size="small" @click="delOrders(record)"></a-button>
                </a-tooltip>
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { reactive, watchEffect, nextTick, h, ref, onUnmounted } from 'vue';
import { cloneDeep, findKey } from 'lodash';
import { CloseOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import moment from 'moment';

import * as orders from 'api/order/index';
import { allSymbolQuotes } from 'api/symbols/index';

import * as orderTypes from '#/order';
import { tableColumns } from './config';

import { useUser } from '@/store/modules/user';
import { useOrder } from '@/store/modules/order';
import { useChartSub } from '@/store/modules/chartSub';
import { ORDER_TYPE } from '@/constants/common';
import { round } from 'utils/common/index';

const userStore = useUser();
const orderStore = useOrder();
const subStore = useChartSub();

interface Menu {
  label: string
  key: orderTypes.TableDataKey
}

const state = reactive({
  menu: [
    { label: '持仓', key: 'position' },
    { label: '订单', key: 'order' },
    { label: '交易历史', key: 'transactionHistory' },
  ] as Menu[],
  columns: tableColumns,
  dataSource: {
    'position': [],
    'order': [],
    'transactionHistory': []
  } as any
});
const activeKey = ref<orderTypes.TableDataKey>('position');

// 获取交易方向
const getType = (e: string | number) => {
  for (let type in ORDER_TYPE) {
    // @ts-ignore
    for (let action in ORDER_TYPE[type]) {
      // @ts-ignore
      if (ORDER_TYPE[type][action] === +e) {
        return action;
      }
    }
  }
};

// 获取订单类型
const getOrderType = (e: number) => {
  return findKey(ORDER_TYPE, (o) => o.buy === e || o.sell === e);
};

// 挂单价距离
const getDistance = (e: orders.resOrders) => {
  const currentQuote = orderStore.currentQuotes[e.symbol];
  const type = getType(e.type);
  const result = type === 'buy' ? currentQuote.ask :  currentQuote.bid;
  const entryPrice = +e.order_price;
  return round(Math.abs(result - entryPrice), 2);
};

// 格式化表格时间字段
const formatTime = (timestamp: string) => {
  const result = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  return result;
};

// 获取现价
const getNowPrice = (e: orders.resOrders, index: number) => {
  try {
    const currentQuote = orderStore.currentQuotes[e.symbol];
    const type = getType(e.type);
    const result = type === 'buy' ? currentQuote.ask :  currentQuote.bid;
    orderStore.tableData[activeKey.value]![index].now_price = +result;
    return result;
  } catch (error) {
    return '';
  }
};

// 获取盈亏
const getProfit = (e: orders.resOrders, index: number) => {
  try {
    let result: string | number = '';
    const currentQuote = orderStore.currentQuotes[e.symbol];
    const currentBuy = currentQuote.ask;
    const currentSell = currentQuote.bid;
    const openPrice = e.open_price;;
    const type = getType(e.type);
    const closePrice = type === 'buy' ? currentBuy : currentSell;
    const volume = e.volume;
    const symbols = subStore.symbols;
    const currentSymbol = symbols.find(e => e.symbol === e.symbol);
    if (currentSymbol) {
      const { contract_size, storage, fee, digits } = currentSymbol;
      // 建仓合约价值 = open_price X contract_size X volume / 100
      const buildingPrice = +(openPrice * contract_size * volume / 100).toFixed(digits);
      // 平仓合约价值 = close_price X contract_size X volume / 100
      const closingPrice = +(closePrice * contract_size * volume / 100).toFixed(digits);
      // buy时 : profit = 平仓合约价值 - 建仓合约价值 + 手续费 + 过夜费
      // sell时 : profit = 建仓合约价值 - 平仓合约价值 + 手续费 + 过夜费
      const direction = type === 'buy' ? closingPrice - buildingPrice : buildingPrice - closingPrice;
      result = direction + (storage || 0) + (fee || 0);
      result = result.toFixed(digits);
    }
    orderStore.tableData[activeKey.value]![index].profit = +result;
    return result;
  } catch (error) {
    return '';
  }
};

// 查找表格数据
const getInfo = () => {
  getOrders();
  getPendingOrders();
  getTradingHistory();
  userStore.getLoginInfo();
};

// 下单时触发
watchEffect(async () => {
  if (orderStore.refreshOrderArea) {
    getInfo();
    orderStore.refreshOrderArea = false;
  }
  // 登录时后查找数据
  if (userStore.ifLogin) {
    await nextTick();
    getOrders();
    getPendingOrders();
    getTradingHistory();
  }
});

// 查询持仓
const getOrders = async () => {
  const resOrders = await orders.openningOrders();
  const resQuotes = await allSymbolQuotes();
  resOrders.data.forEach(item => {
    const foundQuote = resQuotes.data.find(e => e.symbol === item.symbol);
    if (foundQuote) {
      orderStore.currentQuotes[item.symbol] = foundQuote;
    }
  });

  state.dataSource.position= resOrders.data;
  orderStore.tableData.position = cloneDeep(resOrders.data);

  const symbols = resOrders.data.map(e => e.symbol);
  subStore.setMustSubscribeList(symbols);
};

// 市价单平仓
const orderClose = async (record: orders.resOrders) => {
  const res = await orders.marketOrdersAddClose({
    symbol: record.symbol,
    id: record.id,
    volume: record.volume
  });
  if (res.data.action_success) {
    message.success('平仓成功');
    getOrders();
    getTradingHistory();
    userStore.getLoginInfo();
  }
}

// 查询挂单
const getPendingOrders = async () => {
  const res = await orders.pendingOrders();
  state.dataSource.order= res.data;
  orderStore.tableData.order = cloneDeep(res.data);

  const symbols = res.data.map(e => e.symbol);
  subStore.setMustSubscribeList(symbols);
};

// 删除挂单
const delOrders = async (record: orders.resOrders) => {
  const res = await orders.delPendingOrders({
    id: record.id,
    symbol: record.symbol
  });
  if (res.data.action_success) {
    message.success('撤销挂单成功');
    getPendingOrders();
    userStore.getLoginInfo();
  } else {
    message.error(res.data.err_text);
  }
};

// 查询交易历史
const getTradingHistory = async () => {
  const res = await orders.historyOrders({});
  state.dataSource.transactionHistory= res.data;
};

onUnmounted(() => {
  subStore.mustSubscribeList = [];
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_handle.scss';

.orderArea {
  position: fixed;
  bottom: 30px;
  left: 0;
  width: 100%;
  border-top: 1px solid;
  box-sizing: border-box;
  @include border_color('border');
  @include background_color('primary');
  padding: 5px 10px 0 10px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 5px; /*  设置纵轴（y轴）轴滚动条 */
    height: 100%; /*  设置横轴（x轴）轴滚动条 */
  }
  // 滑块颜色
  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    box-shadow: inset 0 0 5px #525252;
    background: #525252;
  }
  // 滚动条背景色
  &::-webkit-scrollbar-track {
    border-radius: 0;
    box-shadow: inset 0 0 5px #131722;
    background: #131722;
  }

  .container {
    width: 100%;
    background-color: #525252;
    border-radius: 5px;
    padding: 5px;
    display: flex;
    box-sizing: border-box;
  }
}

:deep(.ant-tabs-tab .ant-tabs-tab-active) {
  color: #d1d4dc;
}
:deep(.ant-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #d1d4dc;
}
</style>