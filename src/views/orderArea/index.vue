<template>
  <div class="orderArea">
    <a-segmented v-model:value="state.menuActive" :options="state.menu" />
    <div class="container">
      <a-table style="flex: 1" :dataSource="state.dataSource[state.menuActive]" :columns="state.columns[state.menuActive]" :pagination="false">
        <template #bodyCell="{ record, column }">
          <template v-if="column.dataIndex === 'volume'">{{ record.volume / 100 }}手</template>
          <template v-if="column.dataIndex === 'type'">{{ $t(`order.${typeOption[record.type as 0 | 1]}`) }}</template>
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
import { reactive, watchEffect, onUnmounted, nextTick, h, ref, watch } from 'vue';
import { invert } from 'lodash';
import { CloseOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { openningOrders, marketOrdersAddClose, resOrders } from 'api/order/index';
import { useUser } from '@/store/modules/user';
import { useOrder } from '@/store/modules/order';
import { STOCKS_DIRECTION } from '@/constants/common';

const typeOption = invert(STOCKS_DIRECTION);

const userStore = useUser();
const orderStore = useOrder();

const state = reactive({
  menu: ['持仓', '订单', '交易历史'],
  menuActive: '持仓',
  columns: {
    '持仓': [
      { title: '已创建 (UTC+8)', dataIndex: 'time_setup', key: 'time_setup' },
      { title: '交易品种', dataIndex: 'symbol', key: 'symbol' },
      { title: '数量', dataIndex: 'volume', key: 'volume' },
      { title: '方向', dataIndex: 'type', key: 'type' },
      { title: '入场', dataIndex: 'open_price', key: 'open_price' },
      { title: '止盈', dataIndex: 'tp_price', key: 'tp_price' },
      { title: 'S/L', dataIndex: 'sl_price', key: 'sl_price' },
      { title: '净 EUR', dataIndex: 'profit', key: 'profit' },
      { title: '', dataIndex: 'action', key: 'action' },
    ],
    // '订单': [],
    // '交易历史': []
  } as any,
  dataSource: {
    '持仓': [],
    '订单': [],
    '交易历史': []
  } as any
});

const getInfo = () => {
  getOrders();
  userStore.getLoginInfo();
};

const startPolling = () => {
  timer.value = setInterval(() => {
    if (userStore.ifLogin) {
      getInfo();
    }
  }, 5000); // 每隔5秒钟发送一次请求
};

const timer = ref();

onUnmounted(() => {
  clearInterval(timer.value);
});

watchEffect(async () => {
  if (orderStore.refreshOrderArea) {
    getInfo();
    orderStore.refreshOrderArea = false;
  }
  if (userStore.ifLogin) {
    await nextTick();
    getOrders();
  }
});

watch(() => orderStore.polling, newVal => {
  if (newVal) {
    startPolling();
  } else {
    if (timer.value) {
      clearInterval(timer.value);
    }
  }
});

// 查询持仓
const getOrders = async () => {
  const res = await openningOrders({ login: userStore.account.login });
  state.dataSource['持仓'] = res.data;
};

const orderClose = async (record: resOrders) => {
  const res = await marketOrdersAddClose({
    login: record.login,
    symbol: record.symbol,
    id: record.id,
    volume: record.volume
  });
  if (res.data.action_success) {
    message.success('平仓成功');
    getInfo();
  }
}
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