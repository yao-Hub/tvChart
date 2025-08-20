<template>
  <div class="symbolList">
    <div class="header">
      <el-input
        class="symbolList-input"
        v-model="input"
        :placeholder="t('tip.searchSymbol')"
        @click="ifSearch = true"
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

      <div class="modeSwitch" @click="changeMode">
        <BaseImg
          :iconName="mode === 'table' ? 'icon_tabular' : 'icon_lists'"
        ></BaseImg>
      </div>
    </div>

    <div class="symbolList-container">
      <el-table
        v-show="!ifSearch && mode === 'table'"
        v-loading="tableLoading"
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
          <EmptyTip @btnClick="ifSearch = true"></EmptyTip>
        </template>
      </el-table>

      <Lists
        v-show="!ifSearch && mode === 'lists'"
        v-loading="tableLoading"
        :data="dataSource"
        @emptyBtnClick="ifSearch = true"
        @row-contextmenu="rowContextmenu"
      ></Lists>

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
import { IDepth, ISymbolListDataSource } from "@/types/common";
import { nextTick, ref, shallowRef, watch } from "vue";
import { useI18n } from "vue-i18n";

import RightClickMenu from "./components/RightClickMenu.vue";
import Search from "./components/Symbolsearch/index.vue";
import Deep from "./components/deep/index.vue";
import EmptyTip from "./components/EmptyTip.vue";
import Lists from "./components/Lists.vue";

import { useSymbolList } from "./useSymbolList";

import { useQuotes } from "@/store/modules/quotes";
import { useStorage } from "@/store/modules/storage";
const quotesStore = useQuotes();

const { t } = useI18n();

const { getTime, getClass, getPrice } = useSymbolList();

const dataSource = shallowRef<ISymbolListDataSource[]>([]);
const depths = ref<Record<string, IDepth[]>>({});

const tableRowClassName = ({ row }: { row: ISymbolListDataSource }) => {
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
  try {
    tableLoading.value = true;
    if (fromHttp) {
      await symbolsStore.getMySymbols();
    }
    dataSource.value = cloneDeep(symbolsStore.mySymbols_sort);
    tableLoading.value = false;
    await nextTick();

    // 拖拽
    const trs = document.querySelectorAll(
      ".el-table__body tbody .el-table__row"
    );
    trs.forEach((tr, index) => {
      tr.setAttribute("data-id", `${dataSource.value[index].symbol}`);
    });
    createSortable();
  } catch (error) {
    tableLoading.value = false;
  }
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

const menuVisible = ref(false);
const pos = ref({
  left: 0,
  top: 0,
});
const rowData = ref<ISymbolListDataSource>({
  symbol: "",
  topSort: 0,
});
const rowContextmenu = (
  row: ISymbolListDataSource,
  column: any,
  event: MouseEvent
) => {
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
  let result: ISymbolListDataSource[] = [];
  if (order === "ascending") {
    result = orderBy(arr, [prop], ["asc"]) as ISymbolListDataSource[];
  }
  if (order === "descending") {
    result = orderBy(arr, [prop], ["desc"]) as ISymbolListDataSource[];
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

const toogleTopUp = (e: ISymbolListDataSource) => {
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

type IMode = "table" | "lists";
const storageMode = useStorage().getItem("symbolListMode") as IMode;
const mode = ref<IMode>(storageMode || "table");
const changeMode = () => {
  mode.value = mode.value === "table" ? "lists" : "table";
  useStorage().setItem("symbolListMode", mode.value);
};
</script>

<style lang="scss">
@import "@/styles/_handle.scss";
.symbolList-input .el-input__wrapper {
  @include background_color("background-container");
}
</style>
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

:deep(.el-scrollbar__view) {
  height: 100%;
}

.symbolList {
  width: 100%;
  @include background_color("background-component");
  box-sizing: border-box;
  padding: 4px;
}

.header {
  width: calc(100% - 12px);
  display: flex;
  align-items: center;
  gap: 4px;
  .closeIcon {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  .modeSwitch {
    width: var(--component-size);
    height: var(--component-size);
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    cursor: pointer;
    border-radius: 4px;
    &:hover {
      @include background_color("background-hover");
    }
    &:active {
      @include background_color("background-active");
    }
  }
}
.symbolList-container {
  width: 100%;
  // 减去顶部搜索框的高度 - padding
  height: calc(100% - var(--component-size) - 8px);
  margin-top: 8px;
  box-sizing: border-box;
  border-radius: 4px;
  overflow: hidden;
  @include background_color("background-container");
}
</style>
