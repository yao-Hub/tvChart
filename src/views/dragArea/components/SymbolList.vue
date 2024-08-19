<template>
  <div class="main">
    <div class="main_search">
      <a-input
        v-model:value="state.symbol"
        placeholder="搜索交易品种"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input>
    </div>

    <a-table :dataSource="symbols" :columns="state.columns" :pagination="false">
      <template #bodyCell="{ record, column }">
        <template v-if="column.dataIndex === 'bid'">{{
          getQuotes("bid", record.symbol)
        }}</template>
        <template v-if="column.dataIndex === 'ask'">{{
          getQuotes("ask", record.symbol)
        }}</template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { SearchOutlined } from "@ant-design/icons-vue";
import { reactive, computed } from "vue";
import { useChartSub } from "@/store/modules/chartSub";
import { useOrder } from "@/store/modules/order";
import { selectMatchItem } from "utils/common/index";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const chartSubStore = useChartSub();
const orderStore = useOrder();

const state = reactive({
  symbol: "",
  columns: [
    {
      title: t("order.symbol"),
      dataIndex: "symbol",
      key: "symbol",
      width: 100,
    },
    { title: t("order.sellPrice"), dataIndex: "bid", key: "bid", width: 130 },
    { title: t("order.buyPrice"), dataIndex: "ask", key: "ask", width: 130 },
  ],
});

const symbols = computed(() => {
  if (state.symbol) {
    return selectMatchItem(chartSubStore.symbols, state.symbol, "symbol");
  }
  return chartSubStore.symbols;
});

const getQuotes = (type: "bid" | "ask", symbol: string) => {
  if (orderStore.currentQuotes[symbol]) {
    return orderStore.currentQuotes[symbol][type];
  }
  return "-";
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.main {
  padding: 24px 0;
  width: 400px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 5px;
  
  &_search {
    box-sizing: border-box;
    padding: 4px 16px;
    width: 100%;
    margin-bottom: 10px;
    border-top: 1px solid;
    border-bottom: 1px solid;
    @include border_color("border");
  }
}
</style>
