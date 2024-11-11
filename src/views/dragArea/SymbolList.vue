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
        <el-table
          v-if="!ifSearch"
          ref="table"
          :data="dataSource"
          :style="{ width: '100%', height: '100%' }"
          :row-style="{
            height: '24px',
          }"
          header-cell-class-name="header-cell"
          cell-class-name="body-cell"
          row-key="sort"
          :expand-row-keys="expandRowKeys"
          @row-click="rowClick"
          @sort-change="sortChange"
          @expand-change="expandChange"
        >
          <el-table-column type="expand" width="20">
            <template #default="{ row }">
              <Deep :symbol="row.symbols"></Deep>
            </template>
          </el-table-column>
          <el-table-column
            prop="symbols"
            :label="$t('order.symbol')"
            min-width="90"
          />
          <el-table-column
            prop="bid"
            :label="$t('order.sellPrice')"
            min-width="90"
          >
            <template #default="scope">
              <span :class="[quotesClass[scope.row.symbols].bid]">
                {{ getQuotes("bid", scope.row) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="ask"
            :label="$t('order.buyPrice')"
            min-width="90"
          >
            <template #default="scope">
              <span :class="[quotesClass[scope.row.symbols].ask]">
                {{ getQuotes("ask", scope.row) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="variation"
            :label="$t('order.diurnalVariation')"
            sortable="custom"
            min-width="90"
          >
            <template #default="scope">
              <span
                style="text-align: right"
                :class="[+scope.row.variation > 0 ? ' buyWord' : ' sellWord']"
              >
                {{ scope.row.variation }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <Search :input="input" v-if="ifSearch" :mySymbols="dataSource"></Search>
      </div>
    </template>
  </el-auto-resizer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, shallowRef } from "vue";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons-vue";
import Search from "./components/search/index.vue";
import Deep from "./components/deep/index.vue";

interface DataSource {
  symbols: string;
  bid?: string | number;
  ask?: string | number;
  variation?: string | number;
  topSort?: string | number;
}
const dataSource = shallowRef<DataSource[]>([]);
const originSource = ref<DataSource[]>([]);

// 获取自选品种
import { orderBy, cloneDeep } from "lodash";
import { optionalQuery } from "api/symbols/index";
import { useUser } from "@/store/modules/user";
import { useSocket } from "@/store/modules/socket";
const socketStore = useSocket();
const userStore = useUser();
const tableLoading = ref(false);
const getQuery = async () => {
  tableLoading.value = true;
  const queryRes = await optionalQuery();
  dataSource.value = orderBy(queryRes.data, ["sort"]).map((item) => {
    quotesClass.value[item.symbols] = { ask: "", bid: "" };
    return item;
  });
  originSource.value = cloneDeep(dataSource.value);
  tableLoading.value = false;
  await nextTick();

  // 拖拽
  const trs = document.querySelectorAll(".el-table__body tbody .el-table__row");
  trs.forEach((tr, index) => {
    tr.setAttribute("data-id", `${dataSource.value[index].symbols}`);
  });
  createSortable();
};

const getData = async () => {
  await getQuery();
  // 订阅市场深度
  const symbols = dataSource.value.map((item) => item.symbols);
  socketStore.subQuoteDepth(symbols);
  socketStore.getQuoteDepth();
};

watch(
  () => userStore.account.login,
  (val) => {
    val && getData();
  },
  { immediate: true }
);

// 可拖拽行
import Sortable from "sortablejs";
import { editOptionalQuery } from "api/symbols/index";
const sortBox = ref();
const table = ref();
const createSortable = () => {
  const tbody = document.querySelector(".el-table__body tbody");
  if (tbody) {
    sortBox.value = new Sortable(tbody, {
      animation: 150,
      swapThreshold: 1,
      dataIdAttr: "data-id",
      draggable: ".el-table__row",
      // 优化：拖拽时不收起会出现深度跟行分开情况
      onStart: () => {
        expandRowKeys.value = [];
      },
      // 解决拖拽后数据对不上导致行错位问题
      onEnd: (evt: any) => {
        const arr = cloneDeep(dataSource.value);
        const movedItem = arr.splice(evt.oldDraggableIndex, 1)[0];
        arr.splice(evt.newDraggableIndex, 0, movedItem);
        dataSource.value = arr;
      },
      store: {
        set: function (sortable: any) {
          const order = sortable.toArray();
          const symbols = order.map((item: string, index: number) => {
            const topSort = dataSource.value.find(
              (e) => e.symbols === item
            )?.topSort;
            return {
              symbol: item,
              sort: index,
              topSort,
            };
          });
          editOptionalQuery({ symbols });
        },
      },
    });
  }
};

// 显示分类
const ifSearch = ref(false);
const input = ref("");
const closeSearch = () => {
  ifSearch.value = false;
  input.value = "";
  getData();
};

// 实时报价
import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();
const getQuotes = (type: "bid" | "ask", e: DataSource) => {
  if (!e.symbols) {
    return "-";
  }
  const quote = orderStore.currentQuotes[e.symbols];
  const result = quote ? quote[type] : "-";
  e[type] = result;
  return result;
};

// 报价样式
import { Quote } from "#/chart/index";
import { eq } from "lodash";
import { round } from "utils/common/index";
const temQuotes = ref<Record<string, Quote>>({});
const quotesClass = ref<Record<string, { ask: string; bid: string }>>({});

const temVar = ref<Record<string, Quote & { variation: string }>>({});
watch(
  () => orderStore.currentQuotes,
  (quotes) => {
    for (const i in quotes) {
      const newQuote = cloneDeep(quotes[i]);
      const oldQuote = temQuotes.value[i];
      const ifEq = eq(newQuote, oldQuote);
      if (ifEq) {
        break;
      }
      const nowBid = newQuote.bid;
      const nowAsk = newQuote.ask;
      if (oldQuote && quotesClass.value[i]) {
        const oldBid = oldQuote.bid;
        const oldAsk = oldQuote.ask;
        quotesClass.value[i].ask = oldAsk > nowAsk ? "sellWord" : "buyWord";
        quotesClass.value[i].bid = oldBid > nowBid ? "sellWord" : "buyWord";
      }
      temQuotes.value[i] = newQuote;

      // 日变化
      const oldVar = temVar.value[i];
      const result = {
        ...newQuote,
        variation: "",
      };
      if (!oldVar) {
        const close = newQuote.close;
        const open = newQuote.open;
        if (close && open) {
          const variation = round(((close - open) / open) * 100, 2);
          result.variation = variation;
        }
      } else {
        const open = oldVar.open;
        const close = newQuote.bid;
        if (close && open) {
          const variation = round(((close - open) / open) * 100, 2);
          result.open = open;
          result.variation = variation;
        }
      }
      temVar.value[i] = result;
      const found = dataSource.value.find((e) => e.symbols === i);
      if (found) {
        found.variation = result.variation;
      }
    }
  },
  {
    deep: true,
    immediate: true,
  }
);

// 点击行更改图表品种
import { useChartInit } from "@/store/modules/chartInit";
const chartInitStore = useChartInit();
const changeSymbol = (e: any) => {
  const symbol = e.symbols;
  const chartId = chartInitStore.activeChartId;
  chartInitStore.changeChartSymbol({ id: chartId, symbol });
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

// 只一个展开
const expandRowKeys = ref<any[]>([]);
const expandChange = (row: any, expandedRows: any[]) => {
  expandRowKeys.value = expandedRows.length ? [row.sort] : [];
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
:deep(.cell) {
  padding: 0;
}
:deep(.body-cell) {
  padding: 0 !important;
  height: 24px;
  border: none;
  font-size: var(--font-size);
}

:deep(.el-table__expand-icon > .el-icon) {
  display: none;
}

:deep(.el-table__expand-icon) {
  content: url("src/assets/icons/CaretRight.svg");
  transform: scale(0.7);
}
:deep(.el-table__expand-icon--expanded) {
  transform: scale(0.7) rotate(90deg);
}
</style>
