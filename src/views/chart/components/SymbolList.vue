<template>
  <div class="main">
    <div style="display: flex">
      <HolderOutlined class="handle"/>
      <a-input v-model:value="state.symbol" placeholder="搜索交易品种">
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input>
    </div>

    <a-table :dataSource="symbols" :columns="state.columns" :pagination="false">
      <template #bodyCell="{ record, column }">
        <template v-if="column.dataIndex === 'bid'">{{ getQuotes('bid', record.symbol) }}</template>
        <template v-if="column.dataIndex === 'ask'">{{ getQuotes('ask', record.symbol) }}</template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { SearchOutlined, HolderOutlined } from '@ant-design/icons-vue';
import { reactive, computed } from 'vue';
import { useChartSub } from '@/store/modules/chartSub';
import { useOrder } from '@/store/modules/order'

const chartSubStore = useChartSub();
const orderStore = useOrder();

const state = reactive({
  symbol: '',
  columns: [
    { title: '交易品种', dataIndex: 'symbol', key: 'symbol', width: 100 },
    { title: '卖价', dataIndex: 'bid', key: 'bid', width: 130 },
    { title: '买价', dataIndex: 'ask', key: 'ask', width: 130 },
  ]
});

const symbols = computed(() => {
  return chartSubStore.symbols;
});

const getQuotes = (type: 'bid' | 'ask', symbol: string) => {
  if (orderStore.currentQuotes[symbol]) {
    return orderStore.currentQuotes[symbol][type];
  }
  return '-';
};

</script>

<style lang="scss" scoped>
.main {
  padding: 5px;
  width: 400px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: #525252;
  border-radius: 5px;
}
</style>
