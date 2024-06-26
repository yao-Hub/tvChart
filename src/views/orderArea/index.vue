<template>
  <div class="orderArea">
    <a-segmented v-model:value="state.menuActive" :options="segmentedOption" />
    <div class="container">
      <a-table style="flex: 1" :dataSource="dataSource" :columns="columns" :pagination="false">
        <template #bodyCell="{ record, column, index }">
          <template v-if="column.dataIndex === 'time_setup'">{{ formatTime(record.time_setup) }}</template>
          <template v-if="column.dataIndex === 'volume'">{{ record.volume / 100 }}手</template>
          <template v-if="column.dataIndex === 'type'">{{ $t(`order.${getType(record.type)}`) }}</template>
          <template v-if="column.dataIndex === 'now_price'">{{ getNowPrice(record, index) }}</template>
          <template v-if="column.dataIndex === 'profit'">{{ getProfit(record, index) }}</template>
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
  </div>
</template>

<script setup lang="ts">
import { reactive, watchEffect, nextTick, h, computed, onUnmounted } from 'vue';
import { cloneDeep } from 'lodash';
import { CloseOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import moment from 'moment';
import { openningOrders, marketOrdersAddClose, resOrders, pendingOrders, delPendingOrders } from 'api/order/index';
import { useUser } from '@/store/modules/user';
import { useOrder } from '@/store/modules/order';
import { useChartSub } from '@/store/modules/chartSub';
import { BUY_SELL_TYPE } from '@/constants/common';
import { round } from 'utils/common/index';
import * as orderTypes from '#/order';

const userStore = useUser();
const orderStore = useOrder();
const subStore = useChartSub();

const state = reactive({
  menu: [
    { label: '持仓', key: 'position' },
    { label: '订单', key: 'order' },
    { label: '交易历史', key: 'transactionHistory' },
  ],
  menuActive: '',
  columns: {
    'position': [
      { title: '已创建 (UTC+8)', dataIndex: 'time_setup', key: 'time_setup' },
      { title: '交易品种', dataIndex: 'symbol', key: 'symbol' },
      { title: '数量', dataIndex: 'volume', key: 'volume' },
      { title: '方向', dataIndex: 'type', key: 'type' },
      { title: '入场', dataIndex: 'open_price', key: 'open_price' },
      { title: '现价', dataIndex: 'now_price', key: 'now_price', width: 150 },
      { title: '止盈', dataIndex: 'tp_price', key: 'tp_price' },
      { title: '止损', dataIndex: 'sl_price', key: 'sl_price' },
      { title: '净 EUR', dataIndex: 'profit', key: 'profit' },
      { title: '', dataIndex: 'positionAction', key: 'positionAction' },
    ],
    'order': [
      { title: '交易品种', dataIndex: 'symbol', key: 'symbol' },
      { title: '方向', dataIndex: 'type', key: 'type' },
      { title: '提交时间（UTC+8）', dataIndex: 'time_setup', key: 'time_setup' },
      { title: '订单类型', dataIndex: 'type', key: 'type' },
      { title: '当前数量', dataIndex: 'volume', key: 'volume' },
      { title: '触发价位', dataIndex: 'order_price', key: 'order_price' },
      { title: '现价', dataIndex: 'now_price', key: 'now_price', width: 150 },
      { title: '距离', dataIndex: 'distance', key: 'distance' },
      { title: '止盈', dataIndex: 'tp_price', key: 'tp_price' },
      { title: '止损', dataIndex: 'sl_price', key: 'sl_price' },
      { title: '', dataIndex: 'orderAction', key: 'orderAction' },
    ],
    'transactionHistory': []
  } as any,
  dataSource: {
    'position': [],
    'order': [],
    'transactionHistory': []
  } as any
});

// 顶部菜单
const segmentedOption = computed<string[]>(() => {
  return state.menu.map(e => e.label);
});

state.menuActive = segmentedOption.value[0];

// 当前顶部激活菜单
const menuKey = computed(() => {
  const currentMenu = state.menu.find((e: any) => e.label === state.menuActive);
  const key = currentMenu!.key;
  return key as orderTypes.TableDataKey;
});

// 表格列
const columns = computed(() => {
  return state.columns[menuKey.value];
});

// 表格数据
const dataSource = computed(() => {
  return state.dataSource[menuKey.value];
});

// 获取交易方向
const getType = (e: string | number) => {
  for (let type in BUY_SELL_TYPE) {
    // @ts-ignore
    for (let action in BUY_SELL_TYPE[type]) {
      // @ts-ignore
      if (BUY_SELL_TYPE[type][action] === +e) {
        // return t(`order.${action}`);
        return action;
      }
    }
  }
};

// 挂单价距离
const getDistance = (e: resOrders) => {
  const currentQuote = orderStore.currentQuotes[e.symbol];
  const type = getType(e.type);
  const result = type === 'buy' ? currentQuote.ask :  currentQuote.bid;
  const entryPrice = +e.order_price;
  return round(Math.abs(result - entryPrice), 1);
};

// 格式化表格时间字段
const formatTime = (timestamp: string) => {
  const result = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  return result;
};

// 获取现价
const getNowPrice = (e: resOrders, index: number) => {
  try {
    const currentQuote = orderStore.currentQuotes[e.symbol];
    const type = getType(e.type);
    const result = type === 'buy' ? currentQuote.ask :  currentQuote.bid;
    orderStore.tableData[menuKey.value]![index].now_price = +result;
    return result;
  } catch (error) {
    return '';
  }
};

// 获取盈亏
const getProfit = (e: resOrders, index: number) => {
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
    orderStore.tableData[menuKey.value]![index].profit = +result;
    return result;
  } catch (error) {
    return '';
  }
};

// 查找表格数据
const getInfo = () => {
  getOrders();
  getPendingOrders();
  userStore.getLoginInfo();
};

// 下单时触发
watchEffect(async () => {
  if (orderStore.refreshOrderArea) {
    getInfo();
    orderStore.refreshOrderArea = false;
  }
  if (userStore.ifLogin) {
    await nextTick();
    getOrders();
    getPendingOrders();
  }
});

// 查询持仓
const getOrders = async () => {
  const res = await openningOrders();
  state.dataSource.position= res.data;
  orderStore.tableData.position = cloneDeep(res.data);

  const symbols = res.data.map(e => e.symbol);
  subStore.setMustSubscribeList(symbols);
};

// 市价单平仓
const orderClose = async (record: resOrders) => {
  const res = await marketOrdersAddClose({
    symbol: record.symbol,
    id: record.id,
    volume: record.volume
  });
  if (res.data.action_success) {
    message.success('平仓成功');
    getOrders();
    userStore.getLoginInfo();
  }
}

// 查询挂单
const getPendingOrders = async () => {
  const res = await pendingOrders();
  state.dataSource.order= res.data;
  orderStore.tableData.order = cloneDeep(res.data);

  const symbols = res.data.map(e => e.symbol);
  subStore.setMustSubscribeList(symbols);
};

// 删除挂单
const delOrders = async (record: resOrders) => {
  console.log(record);
  const res = await delPendingOrders({
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
  padding: 0 10px;
  display: flex;
  flex-direction: column;

  .container {
    width: 100%;
    height: calc(100% - 30px - 10px);
    background-color: #525252;
    border-radius: 5px;
    padding: 5px;
    display: flex;
    box-sizing: border-box;
  }
}

:deep(.ant-segmented .ant-segmented-item-selected) {
  background-color: #525252;
}
</style>