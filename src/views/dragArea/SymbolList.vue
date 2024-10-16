<template>
  <div>
    <div class="searchInput">
      <el-input
        v-model="input"
        placeholder="搜索交易品种"
        @click="ifSearch = true"
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
      </el-input>
    </div>
    <div class="container">
      <el-auto-resizer v-if="!ifSearch">
        <template #default="{ height, width }">
          <el-table-v2
            v-loading="tableLoading"
            header-class="tableHeader"
            row-class="tableRow"
            :row-height="24"
            :header-height="24"
            :columns="columns"
            :data="dataSource"
            :width="width"
            :height="height"
            :row-props="rowProps"
            v-model:sort-state="sortState"
            @column-sort="onSort"
            fixed
          >
            <template #cell="{ column, rowData }">
              <template v-if="column.dataKey === 'bid'">
                <span :class="[quotesClass[rowData.symbol].bid]">
                  {{ getQuotes("bid", rowData) }}
                </span>
              </template>
              <template v-else-if="column.dataKey === 'ask'">
                <span :class="[quotesClass[rowData.symbol].ask]">
                  {{ getQuotes("ask", rowData) }}
                </span>
              </template>
              <template v-else-if="column.dataKey === 'variation'">
                <span :class="[rowData.variation > 0 ? 'buyWord' : 'sellWord']">
                  {{ getLines(rowData) }}
                </span>
              </template>
              <template v-else>
                {{
                  [null, undefined, ""].includes(rowData[column.dataKey])
                    ? "-"
                    : rowData[column.dataKey]
                }}
              </template>
            </template>
          </el-table-v2>
        </template>
      </el-auto-resizer>

      <Search :input="input" v-if="ifSearch"></Search>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons-vue";
import type { Column, SortBy, SortState } from "element-plus";
import { TableV2SortOrder } from "element-plus";
import { useI18n } from "vue-i18n";
import Search from "./components/search/index.vue";
const { t } = useI18n();

interface DataSource {
  symbol: string;
  bid?: string | number;
  ask?: string | number;
  variation?: string | number;
}
const columns: Column<any>[] = [
  {
    title: t("order.symbol"),
    dataKey: "symbol",
    key: "symbol",
    width: 100,
    sortable: true,
  },
  {
    title: t("order.sellPrice"),
    dataKey: "bid",
    key: "bid",
    width: 100,
    sortable: true,
  },
  {
    title: t("order.buyPrice"),
    dataKey: "ask",
    key: "ask",
    width: 100,
    sortable: true,
  },
  {
    title: t("order.diurnalVariation"),
    dataKey: "variation",
    key: "variation",
    width: 90,
    sortable: true,
  },
];

import { orderBy } from "lodash";
const sortState = ref<SortState>({
  symbol: TableV2SortOrder.DESC,
  bid: TableV2SortOrder.ASC,
  ask: TableV2SortOrder.ASC,
  variation: TableV2SortOrder.ASC,
});
const onSort = ({ key, order }: SortBy) => {
  sortState.value[key] = order;
  dataSource.value = orderBy(dataSource.value, [key], [order]);
};

import { optionalQuery } from "api/symbols/index";
import { useUser } from "@/store/modules/user";
const userStore = useUser();
const dataSource = ref<DataSource[]>([]);
const tableLoading = ref(false);
const getQuery = async () => {
  tableLoading.value = true;
  const queryRes = await optionalQuery();
  dataSource.value = queryRes.data.map((item) => {
    quotesClass.value[item] = { ask: "", bid: "" };
    return { symbol: item };
  });
  tableLoading.value = false;
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
const closeSearch = () => {
  ifSearch.value = false;
  input.value = "";
  getQuery();
};

// 实时报价
import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();
const getQuotes = (type: "bid" | "ask", e: DataSource) => {
  if (!e.symbol) {
    return "-";
  }
  const quote = orderStore.currentQuotes[e.symbol];
  const result = quote ? quote[type] : "-";
  e[type] = result;
  return result;
};

import { Quote } from "#/chart/index";
import { eq, cloneDeep } from "lodash";
const temQuotes = ref<Record<string, Quote>>({});
const quotesClass = ref<Record<string, { ask: string; bid: string }>>({});
watch(
  () => orderStore.currentQuotes,
  (quotes) => {
    for (const i in quotes) {
      const newQuote = cloneDeep(quotes[i]);
      const oldQuote = temQuotes.value[i];
      if (!newQuote) {
        break;
      }
      if (!oldQuote) {
        temQuotes.value[i] = newQuote;
        break;
      }
      const ifEq = eq(newQuote, oldQuote);
      if (ifEq) {
        break;
      }
      if (quotesClass.value[i]) {
        const nowBid = newQuote.bid;
        const nowAsk = newQuote.ask;
        const oldBid = oldQuote.bid;
        const oldAsk = oldQuote.ask;
        quotesClass.value[i].ask = oldAsk > nowAsk ? "sellWord" : "buyWord";
        quotesClass.value[i].bid = oldBid > nowBid ? "sellWord" : "buyWord";
      }
      temQuotes.value[i] = newQuote;
    }
  },
  {
    deep: true,
  }
);

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

const getLines = (e: DataSource) => {
  let result = "-";
  if (orderStore.currentKline[e.symbol]) {
    const { close, open } = orderStore.currentKline[e.symbol];
    const calc = round(((close - open) / open) * 100, 3);
    e.variation = calc;
    result = calc + "%";
  }
  return result;
};

import { useChartInit } from "@/store/modules/chartInit";
const chartInitStore = useChartInit();
const changeSymbol = (e: any) => {
  const symbol = e.symbol;
  const chartId = chartInitStore.activeChartId;
  chartInitStore.changeChartWidgetSymbol({ id: chartId, symbol });
};
const rowProps = ({ rowData }: any) => {
  return {
    onMousedown: () => {
      changeSymbol(rowData);
    },
  };
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.searchInput {
  box-sizing: border-box;
  border-top: 1px solid;
  border-bottom: 1px solid;
  @include border_color("border");
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;

  .closeBtn:hover {
    @include font_color("primary");
  }
}

.container {
  width: 100%;
  position: relative;
  height: calc(100% - 24px - 38px);
  box-sizing: border-box;
  padding-bottom: 5px;
}

:deep(.tableHeader) {
  background: #f6f8fa;
  font-size: 12px;
}
:deep(.el-table-v2__header-cell) {
  background: #f6f8fa;
}
:deep(.el-table-v2__row) {
  border: none;
  font-size: 12px;
}
</style>
