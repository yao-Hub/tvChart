<template>
  <div>
    <div class="search">
      <a-input
        v-model:value="input"
        placeholder="搜索交易品种"
        @click="inputClick"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
        <template #suffix>
          <CloseOutlined
            class="closeBtn"
            @click="closeSearch"
            v-show="ifSearch"
          />
        </template>
      </a-input>
    </div>
    <div class="main" ref="main">
      <a-table
        :dataSource="dataSource"
        :columns="columns"
        :pagination="false"
        v-show="!ifSearch"
        :scroll="{y: tableY}"
      >
        <template #bodyCell="{ record, column }">
          <template v-if="column.dataIndex === 'bid'">
            <span class="sellWord">
              {{ getQuotes("bid", record.symbol) }}
            </span>
          </template>
          <template v-if="column.dataIndex === 'ask'">
            <span class="buyWord">
              {{ getQuotes("ask", record.symbol) }}
            </span>
          </template>
          <template v-if="column.dataIndex === 'variation'">
            <span
              :class="[+getLines(record.symbol) > 0 ? 'buyWord' : 'sellWord']"
            >
              {{ getLines(record.symbol) }}
            </span>
          </template>
        </template>
      </a-table>

      <Search :input="input" v-show="ifSearch"></Search>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons-vue";
import { useI18n } from "vue-i18n";
import Search from "./components/search/index.vue";

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
  {
    title: t("order.diurnalVariation"),
    dataIndex: "variation",
    key: "variation",
    width: 130,
  },
];
const main = ref();
const tableY = ref("");
let observer: ResizeObserver | null = null;
onMounted(() => {
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { height } = entry.contentRect;
      tableY.value = `${height - 50}px`;
    }
  });
  observer.observe(main.value);
});

import { optionalQuery } from "api/symbols/index";
import { useUser } from "@/store/modules/user";

const userStore = useUser();
const dataSource = ref<{ symbol: string }[]>([]);
const getQuery = async () => {
  const queryRes = await optionalQuery();
  dataSource.value = queryRes.data.map((item) => {
    return { symbol: item };
  });
};

watch(
  () => userStore.account.login,
  (val) => {
    val && getQuery();
  },
  {
    immediate: true,
  }
);

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

import { round } from "utils/common/index";
import { klineHistory } from "api/kline/index";
import { useNetwork } from "@/store/modules/network";
const networkStore = useNetwork();
watch(
  () => networkStore.currentNode,
  (val) => {
    val && getKlines();
  }
);
const getKlines = async () => {
  const lineRes = await Promise.all(
    dataSource.value.map((item) => {
      return klineHistory({
        period_type: 1,
        symbol: item.symbol,
        count: 1,
        limit_ctm: new Date().getTime(),
      });
    })
  );
  dataSource.value.forEach((item, index) => {
    orderStore.currentKline[item.symbol] = lineRes[index].data[0];
  });
};

const getLines = (symbol: string) => {
  if (orderStore.currentKline[symbol]) {
    const { close, open } = orderStore.currentKline[symbol];
    return round(((close - open) / open) * 100, 5);
  }
  return "-";
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.main {
  width: 100%;
  overflow: auto;
  height: calc(100% - 60px);
}
.search {
  box-sizing: border-box;
  padding: 4px 16px;
  width: 100%;
  border-top: 1px solid;
  border-bottom: 1px solid;
  @include border_color("border");
  margin-top: 24px;
  .closeBtn:hover {
    @include font_color("primary");
  }
}
</style>
