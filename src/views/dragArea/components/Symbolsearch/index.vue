<template>
  <div v-loading="listState.loading" class="searchList">
    <el-scrollbar v-if="!input && !showSymbols">
      <el-empty v-if="!listState.menu.length" :image-size="80">
        <template #image>
          <BaseImg iconName="icon_empty"></BaseImg>
        </template>
      </el-empty>
      <Block
        v-else
        v-for="item in listState.menu"
        v-show="getTotal(item.type) > 0"
        :title="item.value"
        type="count"
        :total="getTotal(item.type)"
        :count="getCount(item.type)"
        @blockClick="getSymbolsDetail(item.type)"
      ></Block>
    </el-scrollbar>

    <el-scrollbar v-if="!input && showSymbols">
      <Block
        type="count"
        class="searchList_back"
        :total="getTotal(currentType)"
        :count="getCount(currentType)"
      >
        <template #title>
          <div
            class="searchList_back_title"
            @click="() => (showSymbols = false)"
          >
            <el-icon>
              <BaseImg iconName="turnleft" />
            </el-icon>
            <span>{{ currentPath }}</span>
          </div>
        </template>
      </Block>
      <Block
        v-for="item in pathSymbols"
        :title="item.symbol"
        :hideStar="hideStar"
        type="radio"
        :loading="item.loading"
        :ifChecked="getCheckType(item.symbol)"
        @btnClick="(e: string) => btnClick(e, item)"
        @blockClick="itemClick(item)"
      >
      </Block>
    </el-scrollbar>

    <el-scrollbar v-if="input">
      <Block
        v-for="item in filterSymbols"
        :title="item.symbol"
        type="radio"
        :hideStar="hideStar"
        :loading="item.loading"
        :ifChecked="getCheckType(item.symbol)"
        @btnClick="(e: string) => btnClick(e, item)"
        @blockClick="itemClick(item)"
      >
      </Block>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

import Block from "./Block.vue";

import { useSymbols } from "@/store/modules/symbols";
const symbolsStore = useSymbols();

interface Props {
  input: string;
  hideStar?: boolean;
}
const props = defineProps<Props>();

// 所有商品
const allSymbols = computed(() => {
  return symbolsStore.haveQuoteSymbols.map((item: ISessionSymbolInfo) => {
    return {
      ...item,
      loading: false,
    };
  });
});

// 分类、
import { resSymbolAllPath, symbolAllPath } from "api/symbols/index";
const listState = reactive({
  menu: [] as Array<any>,
  pathMap: {} as Record<string, SymbolListItem[]>,
  loading: false,
});

onMounted(async () => {
  try {
    listState.loading = true;
    // 获取分类
    const allPathRes = await symbolAllPath();
    listState.menu = allPathRes.data;
    listState.loading = false;
  } catch (error) {
    listState.loading = false;
  }
});

// 具体分类
watch(
  () => [allSymbols.value, listState.menu],
  ([symbols, menu]) => {
    if (symbols.length && menu.length) {
      menu.forEach((item: resSymbolAllPath) => {
        listState.pathMap[item.type] = symbols.filter((symbol) =>
          symbol.path.includes(item.type)
        );
      });
    }
  },
  { deep: true }
);

// 获取各个分类的总数
const getTotal = (type: string) => {
  if (listState.pathMap[type]) {
    return listState.pathMap[type].length;
  }
  return 0;
};
// 各个分类下的已选商品数量
const getCount = (type: string) => {
  if (listState.pathMap[type]) {
    const filterList = listState.pathMap[type].filter((item: any) => {
      const index = symbolsStore.mySymbols.findIndex(
        (e) => e.symbol === item.symbol
      );
      return index > -1;
    });
    return filterList.length;
  }
  return 0;
};

import { ISessionSymbolInfo } from "@/types/chart";
import { addOptionalQuery, delOptionalQuery } from "api/symbols/index";
import { debounce } from "lodash";
type SymbolListItem = ISessionSymbolInfo & { loading: boolean };
const pathSymbols = ref<SymbolListItem[]>([]);
const showSymbols = ref(false);
const currentPath = ref("");
const currentType = ref("");
// 从分类进入详情列表
const getSymbolsDetail = (type: string) => {
  currentPath.value = listState.menu.find((e) => e.type === type).value;
  pathSymbols.value = listState.pathMap[type];
  showSymbols.value = true;
  currentType.value = type;
};

// 输入查找商品
import { selectMatchItem } from "utils/common/index";
const filterSymbols = ref<SymbolListItem[]>([]);
watch(
  () => props.input,
  (value) => {
    filterSymbols.value = selectMatchItem(allSymbols.value, value, "symbol");
  }
);

// 新增删除自选商品
const btnClick = debounce(async (type: string, listItem: SymbolListItem) => {
  try {
    listItem.loading = true;
    switch (type) {
      case "cancel":
        await delOptionalQuery({ symbols: [listItem.symbol] });
        const index = symbolsStore.mySymbols.findIndex(
          (e) => e.symbol === listItem.symbol
        );
        symbolsStore.mySymbols.splice(index, 1);
        break;
      case "add":
        symbolsStore.mySymbols.push({
          symbol: listItem.symbol,
          sort: symbolsStore.mySymbols.length,
          topSort: 0,
        });
        symbolsStore.mySymbols.forEach((item, index) => {
          item.sort = index;
        });
        await addOptionalQuery({ symbols: symbolsStore.mySymbols });
        break;
      default:
        break;
    }
    listItem.loading = false;
  } catch (error) {
    listItem.loading = false;
  }
}, 200);

// 是否是已经添加的商品
const getCheckType = (symbol: string) => {
  const index = symbolsStore.mySymbols.findIndex((e) => e.symbol === symbol);
  return index > -1;
};

const emit = defineEmits(["itemClick"]);
const itemClick = (e: ISessionSymbolInfo) => {
  emit("itemClick", e);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.el-scrollbar {
  width: 100%;
}
.searchList {
  height: 100%;
  width: 100%;
}
.searchList_back {
  position: sticky;
  @include background_color("background");
  cursor: "default";
  top: 0;
  &_title {
    display: flex;
    gap: 5px;
    align-items: center;
    &:hover {
      cursor: pointer;
      @include font_color("primary");
    }
  }
}
</style>
