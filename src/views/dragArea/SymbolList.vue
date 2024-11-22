<template>
  <div class="symbolList">
    <el-input
      v-model="input"
      placeholder="搜索交易品种"
      @click="ifSearch = true"
      class="input"
    >
      <template #prefix>
        <img class="logo" src="@/assets/icons/icon_search.svg" />
      </template>
      <template #suffix>
        <img
          class="closeIcon"
          src="@/assets/icons/icon_close.svg"
          @click="closeSearch"
          v-show="ifSearch"
        />
      </template>
    </el-input>

    <div style="width: 100%; height: calc(100% - 35px - 4px); margin-top: 8px">
      <el-table
        v-if="!ifSearch"
        ref="table"
        :data="dataSource"
        :style="{ width: '100%', height: '100%' }"
        :header-row-style="{
          height: '32px',
        }"
        header-cell-class-name="header-cell"
        cell-class-name="body-cell"
        row-key="symbols"
        :expand-row-keys="expandRowKeys"
        @sort-change="sortChange"
        @expand-change="expandChange"
      >
        <el-table-column type="expand" width="16">
          <template #default="{ row }">
            <Deep :symbol="row.symbols"></Deep>
          </template>
        </el-table-column>
        <el-table-column
          prop="symbols"
          :label="$t('order.symbol')"
          align="left"
          min-width="108"
        />
        <el-table-column
          prop="bid"
          :label="$t('order.sellPrice')"
          align="right"
          min-width="96"
        >
          <template #default="{ row }">
            <span :class="[quotesClass[row.symbols].bid]">
              {{ row.bid || "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="ask"
          :label="$t('order.buyPrice')"
          align="right"
          min-width="96"
        >
          <template #default="{ row }">
            <span :class="[quotesClass[row.symbols].ask]">
              {{ row.ask || "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="ctm_ms"
          :label="$t('order.time')"
          align="right"
          min-width="88"
        >
          <template #default="{ row }">
            {{ getTime(row?.ctm_ms) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="variation"
          :label="$t('order.diurnalVariation')"
          sortable="custom"
          align="right"
          min-width="84"
        >
          <template #default="{ row }">
            <span :class="[+row.variation > 0 ? ' buyWord' : ' sellWord']">
              {{ row.variation || "-" }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <Search
        class="searchList"
        :input="input"
        v-if="ifSearch"
        :mySymbols="dataSource"
        :headerStyle="{
          background: '#fff',
        }"
      ></Search>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, shallowRef } from "vue";
import Search from "./components/Symbolsearch/index.vue";
import Deep from "./components/deep/index.vue";

interface DataSource {
  symbols: string;
  bid?: string | number;
  ask?: string | number;
  variation?: string | number;
  topSort?: string | number;
  ctm_ms?: number;
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
  dataSource.value = orderBy(queryRes.data, ["sort"]);
  dataSource.value.forEach((item) => {
    quotesClass.value[item.symbols] = { ask: "", bid: "" };
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

import dayjs from "dayjs";
const getTime = (time: number) => {
  if (time) {
    return dayjs(time).format("HH:mm:ss");
  }
  return "-";
};

// 报价样式 实时数据
import { Quote } from "#/chart/index";
import { eq } from "lodash";
import { round } from "utils/common/index";
import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();
const temQuotes = ref<Record<string, Quote>>({});
const quotesClass = ref<Record<string, { ask: string; bid: string }>>({});
const temVar = ref<Record<string, Quote & { variation: string }>>({});
watch(
  () => orderStore.currentQuotes,
  (quotes) => {
    dataSource.value.forEach((item) => {
      const symbol = item.symbols;
      const newQuote = cloneDeep(quotes[symbol]);
      const oldQuote = temQuotes.value[symbol];
      const ifEq = eq(newQuote, oldQuote);
      if (ifEq) {
        return;
      }
      const nowBid = newQuote.bid;
      const nowAsk = newQuote.ask;
      if (oldQuote && quotesClass.value[symbol]) {
        const oldBid = oldQuote.bid;
        const oldAsk = oldQuote.ask;
        quotesClass.value[symbol].ask =
          oldAsk > nowAsk ? "sellWord" : "buyWord";
        quotesClass.value[symbol].bid =
          oldBid > nowBid ? "sellWord" : "buyWord";
      }
      temQuotes.value[symbol] = newQuote;

      // 日变化
      const oldVar = temVar.value[symbol];
      const result = {
        ...newQuote,
        variation: "",
      };
      // 有新数据则close为新数据的bid
      const close = !oldVar ? newQuote.close : newQuote.bid;
      const open = !oldVar ? newQuote.open : oldVar.open;
      if (close && open) {
        const variation = round(((close - open) / open) * 100, 2);
        result.variation = variation;
        !!oldVar && (result.open = open);
      }
      temVar.value[symbol] = result;

      // 赋值
      item.variation = result.variation;
      item.bid = result.bid;
      item.ask = result.ask;
      item.ctm_ms = result.ctm_ms;
    });
  },
  {
    deep: true,
    immediate: true,
  }
);

// 点击行更改图表品种
// import { useChartInit } from "@/store/modules/chartInit";
// const chartInitStore = useChartInit();
// const changeSymbol = (e: any) => {
//   const symbol = e.symbols;
//   const chartId = chartInitStore.activeChartId;
//   chartInitStore.changeChartSymbol({ id: chartId, symbol });
// };
// const rowClick = (row: any) => {
//   changeSymbol(row);
// };

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
  expandRowKeys.value = expandedRows.length ? [row.symbols] : [];
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.symbolList {
  width: 100%;
  @include background_color("background");
  box-sizing: border-box;
  padding: 4px;
}
.input {
  width: calc(100% - 16px);
  height: 32px;
  .closeIcon {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}

.variation {
  display: flex;
  justify-content: flex-end;
}

:deep(.header-cell) {
  font-size: var(--font-size);
  padding: 0;
}
:deep(.cell) {
  padding-left: 0;
  padding-right: 16px;
}
:deep(.body-cell) {
  border: none;
  font-size: var(--font-size);
}

:deep(.el-table__expand-icon > .el-icon) {
  display: none;
}

:deep(.el-table__expand-icon) {
  content: url("src/assets/icons/caretRight.svg");
  transform: scale(0.7);
}
:deep(.el-table__expand-icon--expanded) {
  transform: scale(0.7) rotate(90deg);
}

.searchList {
  @include background_color("background-component");
}
</style>
