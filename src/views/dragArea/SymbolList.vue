<template>
  <div class="symbolList">
    <el-input
      v-model="input"
      :placeholder="t('tip.searchSymbol')"
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
        ref="tableRef"
        :data="dataSource"
        :style="{ width: '100%', height: '100% ' }"
        :header-row-style="{
          height: '32px',
        }"
        header-cell-class-name="header-cell"
        cell-class-name="body-cell"
        row-key="symbol"
        :expand-row-keys="expandRowKeys"
        :row-class-name="tableRowClassName"
        @row-contextmenu="rowContextmenu"
        @sort-change="sortChange"
        @expand-change="expandChange"
      >
        <el-table-column type="expand" width="26">
          <template #default="{ row }">
            <Deep
              :symbol="row.symbol"
              v-model:depths="depths[row.symbol]"
            ></Deep>
          </template>
        </el-table-column>
        <el-table-column
          prop="symbol"
          :label="t('order.symbol')"
          align="left"
          min-width="85"
        >
        </el-table-column>

        <el-table-column
          prop="bid"
          align="right"
          min-width="85"
          :label="t('order.sellPrice')"
        >
          <template #default="{ row }">
            <span :class="getClass(row, 'bid')">
              {{ getPrice(row.symbol, "bid") }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="ask"
          align="right"
          min-width="85"
          :label="t('order.buyPrice')"
        >
          <template #default="{ row }">
            <span :class="getClass(row, 'ask')">
              {{ getPrice(row.symbol, "ask") }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="ctm_ms"
          align="right"
          min-width="88"
          :label="t('order.time')"
        >
          <template #default="{ row }">
            {{ getTime(row.symbol) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="variation"
          sortable="custom"
          align="right"
          min-width="90"
          :label="t('order.diurnalVariation')"
        >
          <template #default="{ row }">
            <span :class="[quotesStore.getVariation(row.symbol).class]">
              {{ quotesStore.getVariation(row.symbol).value }}
            </span>
          </template>
        </el-table-column>

        <template #empty>
          <div class="emptyBox">
            <BaseImg iconName="icon_empty"></BaseImg>
            <div class="tipWords">
              <span>{{ t("tip.noData") }}</span>
              <span>{{ t("tip.addMySymbol") }}</span>
            </div>
            <el-button type="primary" @click="ifSearch = true" class="addBtn">{{
              t("tip.addMyOption")
            }}</el-button>
          </div>
        </template>
      </el-table>

      <Search class="searchList" :input="input" v-if="ifSearch"></Search>
    </div>
    <RightClickMenu
      v-model:visible="menuVisible"
      :pos="pos"
      :rowData="rowData"
      :variOrder="variOrder"
      @toogleTopUp="toogleTopUp"
      @cancelFav="getQuery"
    ></RightClickMenu>
  </div>
</template>

<script setup lang="ts">
import { IDepth } from "@/types/common";
import { nextTick, ref, shallowRef, watch } from "vue";
import { useI18n } from "vue-i18n";

import RightClickMenu from "./components/RightClickMenu.vue";
import Search from "./components/Symbolsearch/index.vue";
import Deep from "./components/deep/index.vue";

import { useQuotes } from "@/store/modules/quotes";

const quotesStore = useQuotes();

const { t } = useI18n();

export interface DataSource {
  symbol: string;
  bid?: string | number;
  ask?: string | number;
  variation?: string | number;
  topSort: number;
  ctm_ms?: number;
}
const dataSource = shallowRef<DataSource[]>([]);
const depths = ref<Record<string, IDepth[]>>({});

const tableRowClassName = ({ row }: { row: DataSource }) => {
  if (row.topSort) {
    return "top-row";
  }
  return "";
};

// 获取自选商品
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
  dataSource.value = cloneDeep(symbolsStore.mySymbols_sort);
  tableLoading.value = false;
  await nextTick();

  // 拖拽
  const trs = document.querySelectorAll(".el-table__body tbody .el-table__row");
  trs.forEach((tr, index) => {
    tr.setAttribute("data-id", `${dataSource.value[index].symbol}`);
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
const tableRef = ref();
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
        const data = cloneDeep(dataSource.value);
        const movedItem = data.splice(evt.oldDraggableIndex, 1)[0];
        data.splice(evt.newDraggableIndex, 0, movedItem);
        const symbols = data.map((item, index) => {
          return {
            symbol: item.symbol,
            sort: index,
            topSort: item.topSort,
          };
        });
        symbols.forEach((item, index, arr) => {
          if (index > 0) {
            const preRowTop = arr[index - 1].topSort;
            if (!preRowTop) {
              item.topSort = 0;
            }
          }
        });
        symbolsStore.mySymbols = symbols;
        dataSource.value = symbols;
        editOptionalQuery({ symbols });
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

const getClass = (rowData: DataSource, type: "ask" | "bid") => {
  const classes = quotesStore.quotesClass;
  const { symbol } = rowData;
  if (classes[symbol]) {
    return classes[symbol][type];
  }
  return "";
};

// 报价样式 实时数据
const getPrice = (symbol: string, type: "bid" | "ask") => {
  const quotes = quotesStore.qoutes;
  const target = quotes[symbol];
  if (target) {
    const symbolInfo = symbolsStore.symbols.find((e) => e.symbol === symbol);
    const digits = symbolInfo?.digits;
    if (digits && target[type]) {
      return target[type].toFixed(digits ?? 2);
    }
    return target[type] || "-";
  }
  return "-";
};

import { useTime } from "@/store/modules/time";
import dayjs from "dayjs";
const timeStore = useTime();
const getTime = (symbol: string) => {
  const quotes = quotesStore.qoutes;
  const target = quotes[symbol];
  if (target) {
    const timezone = timeStore.settedTimezone;
    const time = target.ctm_ms;
    return dayjs(time).tz(timezone).format("HH:mm:ss");
  }
  return "-";
};

const menuVisible = ref(false);
const pos = ref({
  left: 0,
  top: 0,
});
const rowData = ref<DataSource>({
  symbol: "",
  topSort: 0,
});
const rowContextmenu = (row: DataSource, column: any, event: MouseEvent) => {
  event.preventDefault();
  rowData.value = row;
  const { clientX, clientY } = event;
  const menuWidth = 120;

  const bodyDom = document.body;
  const computedStyle = getComputedStyle(bodyDom);
  const componentSize = computedStyle.getPropertyValue("--component-size");
  const size = +componentSize.replace("px", "").trim();
  const munuDom = document.querySelector(".rightClickMenu");
  const menuHeight = munuDom?.getBoundingClientRect().height || size * 5;

  let top = clientY;
  let left = clientX;

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  if (left + menuWidth > screenWidth) {
    left -= menuWidth;
  }
  if (top + menuHeight > screenHeight) {
    top -= menuHeight;
  }

  pos.value.top = top;
  pos.value.left = left;
  menuVisible.value = true;
};

// 排序日变化
const variOrder = ref(null);
const sortChange = ({ order, prop }: any) => {
  variOrder.value = order;
  const arr = dataSource.value.map((item) => {
    return {
      ...item,
      variation: +quotesStore.getVariation(item.symbol).value.replace("%", ""),
    };
  });
  let result: DataSource[] = [];
  if (order === "ascending") {
    result = orderBy(arr, [prop], ["asc"]) as DataSource[];
  }
  if (order === "descending") {
    result = orderBy(arr, [prop], ["desc"]) as DataSource[];
  }
  if (order === null) {
    result = symbolsStore.mySymbols;
    createSortable();
  }
  if (order && sortBox.value) {
    sortBox.value.destroy();
    sortBox.value = null;
  }
  dataSource.value = [...result];
};

// 只一个展开
const expandRowKeys = ref<any[]>([]);
const expandChange = (row: any, expandedRows: any[]) => {
  // 展开时expandedRows.lenght > 0
  expandRowKeys.value = expandedRows.length ? [row.symbol] : [];
};

const toogleTopUp = (e: DataSource) => {
  tableRef.value.sort("variation", null);
  const list = [...symbolsStore.mySymbols];
  const index = list.findIndex((item) => e.symbol === item.symbol);
  if (index !== -1) {
    const topSort = list[index].topSort;
    const item = list[index];
    if (topSort === 0) {
      item.topSort = 1;
      list.splice(index, 1);
      list.unshift(item);
    }
    if (topSort === 1) {
      list.splice(index, 1);
      const topList = list.filter((e) => e.topSort === 1);
      item.topSort = 0;
      list.splice(topList.length, 0, item);
    }
    list.forEach((item, index) => (item.sort = index));
    symbolsStore.mySymbols = list;
    getQuery();
    editOptionalQuery({ symbols: symbolsStore.mySymbols_sort });
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
:deep(.el-table td.el-table__cell div) {
  box-sizing: border-box;
  word-wrap: break-word;
  white-space: nowrap;
}
:deep(.body-cell) {
  border: none !important;
}
:deep(.el-table__empty-text) {
  line-height: normal;
}
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
  height: calc(100% - var(--component-size) - 8px);
  margin-top: 8px;
  box-sizing: border-box;
  border-radius: 4px;
  overflow: hidden;
}

.emptyBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 60px;
  .tipWords {
    @include font_color("word-info");
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .addBtn {
    min-width: 86px;
    margin-top: 8px;
  }
}

.searchList {
  @include background_color("background");
}
</style>
