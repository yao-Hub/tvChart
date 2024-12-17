<template>
  <div class="symbolList">
    <el-input
      v-model="input"
      placeholder="搜索交易品种"
      @click="ifSearch = true"
      class="input"
    >
      <template #prefix>
        <BaseImg class="logo" iconName="icon_search" />
      </template>
      <template #suffix>
        <BaseImg
          class="closeIcon"
          iconName="icon_close"
          @click="closeSearch"
          v-show="ifSearch"
        />
      </template>
    </el-input>

    <div class="container">
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
        @row-contextmenu="rowContextmenu"
        @sort-change="sortChange"
        @expand-change="expandChange"
      >
        <el-table-column type="expand" width="26">
          <template #default="{ row }">
            <Deep
              :symbol="row.symbols"
              v-model:depths="depths[row.symbols]"
            ></Deep>
          </template>
        </el-table-column>
        <el-table-column
          prop="symbols"
          :label="$t('order.symbol')"
          align="left"
          min-width="90"
        />
        <el-table-column
          prop="bid"
          :label="$t('order.sellPrice')"
          align="right"
          min-width="96"
        >
          <template #default="{ row }">
            <span :class="[quotesClass[row.symbols].bid]">
              {{ getPrice(row.symbols, "bid") }}
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
              {{ getPrice(row.symbols, "ask") }}
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
            {{ getTime(row.symbols) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="variation"
          :label="$t('order.diurnalVariation')"
          sortable="custom"
          align="right"
          min-width="90"
        >
          <template #default="{ row }">
            <span :class="[getVariation(row.symbols).class]">
              {{ getVariation(row.symbols).value }}
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
    <RightClickMenu
      v-model:visible="menuVisible"
      :pos="pos"
      :symbol="menuSymbol"
    ></RightClickMenu>
  </div>
</template>

<script setup lang="ts">
import { IDepth } from "@/types/common";
import { nextTick, ref, shallowRef, watch } from "vue";
import RightClickMenu from "./components/RightClickMenu.vue";
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
const depths = ref<Record<string, IDepth[]>>({});

// 获取自选品种
import { useSymbols } from "@/store/modules/symbols";
import { useUser } from "@/store/modules/user";
import { cloneDeep, orderBy } from "lodash";
const symbolsStore = useSymbols();
const userStore = useUser();
const tableLoading = ref(false);
const getQuery = async (fromHttp?: boolean) => {
  tableLoading.value = true;
  if (fromHttp) {
    await symbolsStore.getMySymbols();
  }
  dataSource.value = symbolsStore.mySymbols_sort;
  dataSource.value.forEach((item) => {
    quotesClass.value[item.symbols] = { ask: "", bid: "" };
  });
  originSource.value = cloneDeep(symbolsStore.mySymbols_sort);
  tableLoading.value = false;
  await nextTick();

  // 拖拽
  const trs = document.querySelectorAll(".el-table__body tbody .el-table__row");
  trs.forEach((tr, index) => {
    tr.setAttribute("data-id", `${dataSource.value[index].symbols}`);
  });
  createSortable();
};

watch(
  () => userStore.account.login,
  (val) => {
    val && getQuery(true);
  },
  { immediate: true }
);

// 可拖拽行
import { editOptionalQuery } from "api/symbols/index";
import Sortable from "sortablejs";
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
  getQuery();
};

// 报价样式 实时数据
import { IQuote } from "#/chart/index";
import { useOrder } from "@/store/modules/order";
import { eq } from "lodash";
const orderStore = useOrder();
const temQuotes = ref<Record<string, IQuote>>({});
const quotesClass = ref<Record<string, { ask: string; bid: string }>>({});
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
    });
  },
  {
    deep: true,
    immediate: true,
  }
);
const getPrice = (symbol: string, type: "bid" | "ask") => {
  const quotes = orderStore.currentQuotes;
  const target = quotes[symbol];
  if (target) {
    const symbolInfo = symbolsStore.symbols.find((e) => e.symbol === symbol);
    const digits = symbolInfo?.digits;
    if (digits) {
      return target[type].toFixed(digits);
    }
    return target[type];
  }
  return "-";
};

import { useTime } from "@/store/modules/time";
import dayjs from "dayjs";
const timeStore = useTime();
const getTime = (symbol: string) => {
  const quotes = orderStore.currentQuotes;
  const target = quotes[symbol];
  if (target) {
    const timezone = timeStore.settedTimezone;
    const time = target.ctm_ms;
    return dayjs(time).tz(timezone).format("HH:mm:ss");
  }
  return "-";
};

// 日变化
import { round } from "utils/common/index";
const getVariation = (symbol: string) => {
  const result = {
    class: "",
    value: "-",
  };
  const quote = orderStore.currentQuotes[symbol];
  if (quote) {
    const close = quote.close;
    const open = quote.open;
    const variation = round(((close - open) / open) * 100, 2);
    result.value = `${variation}%`;
    result.class = +variation > 0 ? " buyWord" : " sellWord";
  }
  return result;
};

const menuVisible = ref(false);
const pos = ref({
  left: 0,
  top: 0,
});
const menuSymbol = ref("");
document.addEventListener("mouseup", () => {
  menuVisible.value = false;
});
const rowContextmenu = (row: any, column: any, event: MouseEvent) => {
  event.preventDefault();
  menuSymbol.value = row.symbols;
  const symbolList = document.querySelector(".symbolList");
  const { top, left } = symbolList!.getBoundingClientRect();
  const { clientX, clientY } = event;
  pos.value.top = clientY - top;
  pos.value.left = clientX - left;
  menuVisible.value = true;
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
// 展开时订阅，收起时取消订阅
import { useSocket } from "@/store/modules/socket";
const socketStore = useSocket();
const expandRowKeys = ref<any[]>([]);
const expandChange = (row: any, expandedRows: any[]) => {
  // 展开时expandedRows.lenght > 0
  if (expandedRows.length) {
    socketStore.emitQuoteDepth([row.symbols]);
    const unsubSymbols = expandedRows
      .filter((e) => e.symbols !== row.symbols)
      .map((item) => item.symbols);
    if (unsubSymbols.length) {
      socketStore.unSubQuoteDepth(unsubSymbols);
    }
  } else {
    socketStore.unSubQuoteDepth([row.symbols]);
  }
  expandRowKeys.value = expandedRows.length ? [row.symbols] : [];
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.symbolList {
  width: 100%;
  @include background_color("background-component");
  box-sizing: border-box;
  padding: 4px;
}
.input {
  width: calc(100% - 12px);
  .closeIcon {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}

.container {
  width: 100%;
  // 减去顶部搜索框的高度 - padding
  height: calc(100% - var(--size) - 8px);
  margin-top: 8px;
  box-sizing: border-box;
  border-radius: 4px;
  overflow: hidden;
}

.searchList {
  @include background_color("background-component");
}

:deep(.body-cell) {
  border: none;
}
</style>
