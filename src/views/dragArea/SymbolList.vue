<template>
  <el-auto-resizer>
    <template #default="{ height, width }">
      <div class="searchInput" :style="{ width: `${width - 12}px` }">
        <el-input
          v-model="input"
          placeholder="搜索交易品种"
          @click="ifSearch = true"
          size="small"
          style="width: 98%"
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
      <div
        :style="{
          width: `${width}px`,
          height: `${height - 24 - 5}px`,
        }"
      >
        <el-auto-resizer v-if="!ifSearch">
          <template #default="{ height, width }">
            <el-table
              :data="dataSource"
              :style="{ width: width + 'px', height: height + 'px' }"
              :row-style="{
                height: '24px',
              }"
              header-cell-class-name="header-cell"
              cell-class-name="body-cell"
              @row-click="rowClick"
              @sort-change="sortChange"
            >
              <el-table-column
                prop="symbol"
                :label="$t('order.symbol')"
                min-width="90"
              />
              <el-table-column
                prop="bid"
                :label="t('order.sellPrice')"
                min-width="80"
              >
                <template #default="scope">
                  <span :class="[quotesClass[scope.row.symbol].bid]">
                    {{ getQuotes("bid", scope.row) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                prop="ask"
                :label="t('order.buyPrice')"
                min-width="80"
              >
                <template #default="scope">
                  <span :class="[quotesClass[scope.row.symbol].ask]">
                    {{ getQuotes("ask", scope.row) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                prop="variation"
                :label="t('order.diurnalVariation')"
                sortable="custom"
                min-width="90"
              >
                <template #default="scope">
                  <span
                    style="text-align: right"
                    :class="[
                      scope.row.variation > 0 ? ' buyWord' : ' sellWord',
                    ]"
                  >
                    {{ getLines(scope.row) }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-auto-resizer>

        <Search :input="input" v-if="ifSearch"></Search>
      </div>
    </template>
  </el-auto-resizer>
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
const dataSource = ref<DataSource[]>([]);
const originSource = ref<DataSource[]>([]);

// 获取自选品种
import { orderBy } from "lodash";
import { optionalQuery } from "api/symbols/index";
import { useUser } from "@/store/modules/user";
const userStore = useUser();
const tableLoading = ref(false);
const getQuery = async () => {
  tableLoading.value = true;
  const queryRes = await optionalQuery();
  dataSource.value = orderBy(queryRes.data, ["sort"]).map((item) => {
    quotesClass.value[item.symbols] = { ask: "", bid: "" };
    return { symbol: item.symbols };
  });
  originSource.value = dataSource.value;
  tableLoading.value = false;
};

// 编辑自选品种
const editQuery = () => {
  console.log(dataSource.value);
};

// 可拖拽行
import Sortable from "sortablejs";
const sortBox = ref();
const createSortable = () => {
  const tbody = document.querySelector(".el-table__body tbody");
  if (tbody) {
    sortBox.value = new Sortable(tbody, {
      animation: 150,
      swapThreshold: 1,
      store: {
        set: function (sortable: any) {
          var order = sortable.toArray();
          console.log(order, sortable);
        },
      },
      onEnd: () => editQuery(),
    });
  }
};
onMounted(() => {
  createSortable();
});

watch(
  () => userStore.account.login,
  (val) => {
    val && getQuery();
  },
  { immediate: true }
);

// 显示分类
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

// 报价样式
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

// 日变化获取
import { round } from "utils/common/index";
const getLines = (e: DataSource) => {
  let result = "-";
  if (orderStore.currentKline[e.symbol]) {
    const { close, open } = orderStore.currentKline[e.symbol];
    const calc = round(((close - open) / open) * 100, 2);
    e.variation = calc;
    result = calc.includes("-") ? `${calc}%` : `\u00A0${calc}%`;
  }
  return result;
};

// 点击行更改图表品种
import { useChartInit } from "@/store/modules/chartInit";
const chartInitStore = useChartInit();
const changeSymbol = (e: any) => {
  const symbol = e.symbol;
  const chartId = chartInitStore.activeChartId;
  chartInitStore.changeChartWidgetSymbol({ id: chartId, symbol });
};
const rowClick = (row: any) => {
  changeSymbol(row);
};

// 排序日变化
const sortChange = ({ order, prop }: any) => {
  let result: any;
  if (order === "ascending") {
    result = orderBy(dataSource.value, [prop], ["asc"]);
  }
  if (order === "descending") {
    result = orderBy(dataSource.value, [prop], ["desc"]);
  }
  if (order === null) {
    result = originSource.value;
    createSortable();
  }
  if (order && sortBox.value) {
    sortBox.value.destroy();
    sortBox.value = null;
  }
  dataSource.value = result;
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.searchInput {
  height: 24px;
  margin-bottom: 5px;
  padding-left: 30px;
  box-sizing: border-box;
  .closeBtn:hover {
    @include font_color("primary");
  }
}

.variation {
  display: flex;
  justify-content: flex-end;
}

:deep(.header-cell) {
  background: #f6f8fa !important;
  font-size: var(--font-size) !important;
  padding: 0 !important;
  height: 24px !important;
}
:deep(.body-cell) {
  padding: 0 !important;
  height: 24px !important;
  border: none !important;
}
</style>
