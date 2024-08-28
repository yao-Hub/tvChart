<template>
  <div class="main">
    <div class="main_search">
      <a-input
        v-model:value="input"
        placeholder="搜索交易品种"
        @click="inputClick"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
        <template #suffix>
          <CloseOutlined @click="closeSearch" />
        </template>
      </a-input>
    </div>

    <a-table
      :dataSource="dataSource"
      :columns="columns"
      :pagination="false"
      v-if="!ifSearch"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.dataIndex === 'bid'">{{
          getQuotes("bid", record.symbol)
        }}</template>
        <template v-if="column.dataIndex === 'ask'">{{
          getQuotes("ask", record.symbol)
        }}</template>
      </template>
    </a-table>

    <Search :input="input" v-else></Search>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons-vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const columns = [
  {
    title: t("order.symbol"),
    dataIndex: "symbol",
    key: "symbol",
    width: 100,
  },
  { title: t("order.sellPrice"), dataIndex: "bid", key: "bid", width: 130 },
  { title: t("order.buyPrice"), dataIndex: "ask", key: "ask", width: 130 },
];

import { optionalQuery } from "api/symbols/index";
import { useUser } from "@/store/modules/user";
const userStore = useUser();
const dataSource = ref<{ symbol: string }[]>([]);
const getQuery = async () => {
  const res = await optionalQuery();
  dataSource.value = res.data.map((item) => {
    return { symbol: item };
  });
};
watch(
  () => userStore.account.login,
  (val) => {
    val && getQuery();
  }
);

import Search from "./components/Search/index.vue";
const ifSearch = ref(false);
const input = ref("");
const inputClick = () => {
  ifSearch.value = true;
};
const closeSearch = () => {
  ifSearch.value = false;
  input.value = "";
  getQuery();
};

// 实时报价
import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();
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
