<template>
  <div class="symbolList">
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
    <div class="list" ref="list">
      <a-table
        :dataSource="dataSource"
        :columns="columns"
        :pagination="false"
        v-if="!ifSearch"
        :scroll="{ y: tableY }"
      >
        <template #bodyCell="{ record, column, text }">
          <div @click="changeSymbol(record)" style="cursor: pointer;">
            <template v-if="column.dataIndex === 'bid'">
              <span :class="[quotesClass[record.symbol].bid]">
                {{ getQuotes("bid", record) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'ask'">
              <span :class="[quotesClass[record.symbol].ask]">
                {{ getQuotes("ask", record) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'variation'">
              <span :class="[ record.variation > 0 ? 'buyWord' : 'sellWord' ]">
                {{ getLines(record) }}
              </span>
            </template>
            <template v-else>
              {{ [null, undefined, ""].includes(text) ? "-" : text }}
            </template>
          </div>
        </template>
      </a-table>

      <div v-if="ifSearch" :style="{height: listH}">
        <Search :input="input"></Search>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons-vue";
import { useI18n } from "vue-i18n";
import Search from "./components/search/index.vue";

const { t } = useI18n();
interface DataSource {
  symbol: string;
  bid?: string | number;
  ask?: string | number;
  variation?: string | number;
}
const columns = [
  {
    title: t("order.symbol"),
    dataIndex: "symbol",
    key: "symbol",
    width: 80,
    sorter: (a: DataSource, b: DataSource) => a.symbol.localeCompare(b.symbol),
  },
  {
    title: t("order.sellPrice"),
    dataIndex: "bid",
    key: "bid",
    width: 80,
    sorter: (a: DataSource, b: DataSource) => {
      const bidA = typeof a.bid === 'number' ? a.bid : -Infinity;
      const bidB = typeof b.bid === 'number' ? b.bid : -Infinity;
      return bidA - bidB;
    }
  },
  {
    title: t("order.buyPrice"),
    dataIndex: "ask",
    key: "ask",
    width: 80,
    sorter: (a: DataSource, b: DataSource) => {
      const askA = typeof a.ask === 'number' ? a.ask : -Infinity;
      const askB = typeof b.ask === 'number' ? b.ask : -Infinity;
      return askA - askB;
    },
  },
  {
    title: t("order.diurnalVariation"),
    dataIndex: "variation",
    key: "variation",
    width: 90,
    sorter: (a: DataSource, b: DataSource) => {
      const variationA = typeof a.variation === 'number' ? a.variation : -Infinity;
      const variationB = typeof b.variation === 'number' ? b.variation : -Infinity;
      return variationA - variationB;
    },
  },
];
const list = ref();
const tableY = ref("");
const listH = ref("");
let observer: ResizeObserver | null = null;
onMounted(() => {
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { height } = entry.contentRect;
      tableY.value = `${height - 50}px`;
    }
  });
  observer.observe(list.value);

  const h = document.querySelector(".list")?.getBoundingClientRect().height;
  if (h) {
    listH.value = `${h}px`
  }
});

import { optionalQuery } from "api/symbols/index";
import { useUser } from "@/store/modules/user";

const userStore = useUser();
const dataSource = ref<DataSource[]>([]);
const getQuery = async () => {
  const queryRes = await optionalQuery();
  dataSource.value = queryRes.data.map((item) => {
    quotesClass.value[item] = { ask: "", bid: "" };
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
    result = calc + '%';
  }
  return result;
};

import { useChartInit } from "@/store/modules/chartInit";
const chartInitStore = useChartInit();
const changeSymbol = (e: any) => {
  const symbol = e.symbol;
  const chartId = chartInitStore.activeChartId;
  chartInitStore.changeChartWidgetSymbol({ id: chartId, symbol })
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.list {
  width: 100%;
  position: relative;
  height: calc(100% - 24px);
  box-sizing: border-box;
  padding-bottom: 5px;
}

.search {
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
:deep .ant-input-affix-wrapper {
  height: 28px;
  font-size: 12px;
}
:deep .ant-table-wrapper .ant-table {
  border-radius: 0;
}
:deep .ant-table-wrapper .ant-table:not(.ant-table-bordered) .ant-table-tbody >tr >td  {
  border: none;
}
</style>
