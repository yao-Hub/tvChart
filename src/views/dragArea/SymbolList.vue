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
        ref="table"
        :data="dataSource"
        :style="{ width: '100%', height: '100% ' }"
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
        >
        </el-table-column>

        <el-table-column prop="bid" align="right" min-width="96">
          <template #header>
            <div class="table_header">
              <span class="line">|</span>
              <span>{{ $t("order.sellPrice") }}</span>
            </div>
          </template>
          <template #default="{ row }">
            <span :class="getClass(row, 'bid')">
              {{ getPrice(row.symbols, "bid") }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="ask" align="right" min-width="96">
          <template #header>
            <div class="table_header">
              <span class="line">|</span>
              <span>{{ $t("order.buyPrice") }}</span>
            </div>
          </template>
          <template #default="{ row }">
            <span :class="getClass(row, 'ask')">
              {{ getPrice(row.symbols, "ask") }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="ctm_ms" align="right" min-width="88">
          <template #header>
            <div class="table_header">
              <span class="line">|</span>
              <span>{{ $t("order.time") }}</span>
            </div>
          </template>
          <template #default="{ row }">
            {{ getTime(row.symbols) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="variation"
          sortable="custom"
          align="right"
          min-width="90"
        >
          <template #header>
            <div class="table_header">
              <span class="line">|</span>
              <span>{{ $t("order.diurnalVariation") }}</span>
            </div>
          </template>
          <template #default="{ row }">
            <span :class="[quotesStore.getVariation(row.symbols).class]">
              {{ quotesStore.getVariation(row.symbols).value }}
            </span>
          </template>
        </el-table-column>

        <template #empty>
          <div class="emptyBox">
            <el-text type="info">{{ $t("tip.noData") }}</el-text>
            <el-text type="info">{{ $t("tip.addMySymbol") }}</el-text>
          </div>
        </template>
      </el-table>

      <Search
        class="searchList"
        :input="input"
        v-if="ifSearch"
        :mySymbols="dataSource"
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
import { useI18n } from "vue-i18n";

import RightClickMenu from "./components/RightClickMenu.vue";
import Search from "./components/Symbolsearch/index.vue";
import Deep from "./components/deep/index.vue";

import { useQuotes } from "@/store/modules/quotes";

const quotesStore = useQuotes();

const { t } = useI18n();

interface DataSource {
  symbols: string;
  bid?: string | number;
  ask?: string | number;
  variation?: string | number;
  topSort?: string | number;
  ctm_ms?: number;
}
const dataSource = shallowRef<DataSource[]>([]);
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
  dataSource.value = cloneDeep(symbolsStore.mySymbols_sort);
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

const getClass = (rowData: DataSource, type: "ask" | "bid") => {
  const classes = quotesStore.quotesClass;
  const { symbols } = rowData;
  if (classes[symbols]) {
    return classes[symbols][type];
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
      return target[type].toFixed(digits);
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
const menuSymbol = ref("");
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
  const arr = dataSource.value.map((item) => {
    return {
      ...item,
      variation: +quotesStore.getVariation(item.symbols).value.replace("%", ""),
    };
  });
  let result: any;
  if (order === "ascending") {
    result = orderBy(arr, [prop], ["asc"]);
  }
  if (order === "descending") {
    result = orderBy(arr, [prop], ["desc"]);
  }
  if (order === null) {
    result = symbolsStore.mySymbols_sort;
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
  // 展开时expandedRows.lenght > 0
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
  height: calc(100% - var(--component-size) - 8px);
  margin-top: 8px;
  box-sizing: border-box;
  border-radius: 4px;
  overflow: hidden;
}

.emptyBox {
  display: flex;
  flex-direction: column;

  span {
    height: 32px;
  }
}

.searchList {
  @include background_color("background");
}

:deep(.header-cell .cell) {
  display: flex;
  align-items: center;
}
:deep(.body-cell) {
  border: none !important;
}
.table_header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  .line {
    @include font_color("border");
  }
}
</style>
