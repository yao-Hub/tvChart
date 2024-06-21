<template>
  <div class="orderArea">
    <a-segmented v-model:value="state.menuActive" :options="segmentedOption" />
    <div class="container">
      <a-table style="flex: 1" :dataSource="dataSource" :columns="columns" :pagination="false">
        <template #bodyCell="{ record, column, index }">
          <template v-if="column.dataIndex === 'time_setup'">{{ formatTime(record.time_setup) }}</template>
          <template v-if="column.dataIndex === 'volume'">{{ record.volume / 100 }}手</template>
          <template v-if="column.dataIndex === 'type'">{{ $t(`order.${typeOption[record.type as 0 | 1]}`) }}</template>
          <template v-if="column.dataIndex === 'now_price'">{{ getNowPrice(record, index) }}</template>
          <template v-if="column.dataIndex === 'profit'">{{ getProfit(record, index) }}</template>
          <template v-if="column.dataIndex === 'action'">
            <a-tooltip title="平仓">
              <a-button :icon="h(CloseOutlined)" size="small" @click="orderClose(record)"></a-button>
            </a-tooltip>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watchEffect, nextTick, h, computed } from 'vue';
import { invert, cloneDeep } from 'lodash';
import { CloseOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import moment from 'moment';
import { openningOrders, marketOrdersAddClose, resOrders, pendingOrders } from 'api/order/index';
import { useUser } from '@/store/modules/user';
import { useOrder } from '@/store/modules/order';
import { useChartSub } from '@/store/modules/chartSub';
import { STOCKS_DIRECTION } from '@/constants/common';
import { subscribeSocket } from 'utils/socket/operation';
import * as orderTypes from '#/order';

const typeOption = invert(STOCKS_DIRECTION);

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
      { title: 'S/L', dataIndex: 'sl_price', key: 'sl_price' },
      { title: '净 EUR', dataIndex: 'profit', key: 'profit' },
      { title: '', dataIndex: 'action', key: 'action' },
    ],
    'order': [
      { title: '交易品种', dataIndex: 'symbol', key: 'symbol' },
      { title: '方向', dataIndex: '', key: '' },
      { title: '提交时间（UTC+8）', dataIndex: '', key: '' },
      { title: '订单类型', dataIndex: '', key: '' },
      { title: '当前数量', dataIndex: '', key: '' },
      { title: 'Submission Price', dataIndex: '', key: '' },
      { title: '距离', dataIndex: '', key: '' },
      { title: '止盈', dataIndex: '', key: '' },
      { title: 'S/L', dataIndex: '', key: '' },
      { title: '', dataIndex: 'action', key: 'action' },
    ],
    'transactionHistory': []
  } as any,
  dataSource: {
    'position': [],
    'order': [],
    'transactionHistory': []
  } as any
});

const segmentedOption = computed<string[]>(() => {
  return state.menu.map(e => e.label);
});

state.menuActive = segmentedOption.value[0];

const menuKey = computed(() => {
  const currentMenu = state.menu.find((e: any) => e.label === state.menuActive);
  const key = currentMenu!.key;
  return key as orderTypes.TableDataKey;
});

const columns = computed(() => {
  return state.columns[menuKey.value];
});

const dataSource = computed(() => {
  return state.dataSource[menuKey.value];
});

const formatTime = (timestamp: string) => {
  const result = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  return result;
};

const getNowPrice = (e: resOrders, index: number) => {
  try {
    const currentQuote = orderStore.currentQuotes[e.symbol];
    const result = e.type ? currentQuote.ask :  currentQuote.bid;
    orderStore.tableData[menuKey.value]![index].now_price = +result;
    return result;
  } catch (error) {
    return '';
  }
};

const getProfit = (e: resOrders, index: number) => {
  try {
    let result: string | number = '';
    const currentQuote = orderStore.currentQuotes[e.symbol];
    const currentBuy = currentQuote.ask;
    const currentSell = currentQuote.bid;
    const openPrice = e.open_price;;
    // profit = 平仓合约价值 - 建仓合约价值 + 手续费 + 过夜费
    // 建仓合约价值 = open_price X contract_size X volume / 100
    // 平仓合约价值 = close_price X contract_size X volume / 100
    const closePrice = e.type ? currentBuy : currentSell;
    const volume = e.volume;
    const symbols = subStore.symbols;
    const currentSymbol = symbols.find(e => e.symbol === e.symbol);
    if (currentSymbol) {
      const { contract_size, storage, fee, digits } = currentSymbol;
      const buildingPrice = +(openPrice * contract_size * volume / 100).toFixed(digits);
      const closingPrice = +(closePrice * contract_size * volume / 100).toFixed(digits);
      result = closingPrice - buildingPrice + (storage || 0) + (fee || 0);
      result = result.toFixed(digits);
    }
    orderStore.tableData[menuKey.value]![index].profit = +result;
    return result;
  } catch (error) {
    return '';
  }
};

const getInfo = () => {
  getOrders();
  getPendingOrders();
  userStore.getLoginInfo();
};

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
  subStore.mustSubscribeList = symbols;
  symbols.forEach(item => {
    subscribeSocket({ resolution: '1', symbol: item });
  })
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
    getInfo();
  }
}

// 查询挂单
const getPendingOrders = async () => {
  const res = await pendingOrders();
  state.dataSource.order= res.data;
  orderStore.tableData.order = cloneDeep(res.data);

  // const symbols = res.data.map(e => e.symbol);
  // subStore.mustSubscribeList = symbols;
  // symbols.forEach(item => {
  //   subscribeSocket({ resolution: '1', symbol: item });
  // })
};
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