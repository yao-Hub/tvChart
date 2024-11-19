<template>
  <div v-loading="listState.loading" class="searchList">
    <el-scrollbar v-if="!input && !showSymbols">
      <Block
        v-for="item in listState.menu"
        :title="item.value"
        type="count"
        :total="getTotal(item.type)"
        :count="getCount(item.type)"
        @blockClick="getSymbols(item.type)"
      ></Block>
    </el-scrollbar>

    <el-scrollbar v-if="!input && showSymbols">
      <Block class="back">
        <template #title>
          <div class="back_title" @click="() => (showSymbols = false)">
            <el-icon>
              <img src="@/assets/icons/turnleft.svg" />
            </el-icon>
            <span>{{ currentPath }}</span>
          </div>
        </template>
      </Block>
      <Block
        v-for="item in symbolList"
        :title="item.symbol"
        type="radio"
        :loading="item.loading"
        :ifChecked="getCheckType(item.symbol)"
        @btnClick="(e) => btnClick(e, item)"
      >
      </Block>
    </el-scrollbar>

    <el-scrollbar v-if="input">
      <Block
        v-for="item in filterSymbols"
        :title="item.symbol"
        type="radio"
        :loading="item.loading"
        :ifChecked="getCheckType(item.symbol)"
        @btnClick="(e) => btnClick(e, item)"
      >
      </Block>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref, onMounted } from "vue";

import Block from "./Block.vue";

interface Props {
  input: string;
  mySymbols: any[];
}
const props = defineProps<Props>();

// 所有品种
import { useChartSub } from "@/store/modules/chartSub";
const chartSubStore = useChartSub();
const allSymbols = computed(() => {
  return chartSubStore.symbols.map((item: SessionSymbolInfo) => {
    return {
      ...item,
      loading: false,
    };
  });
});

// 输入查找品种
import { selectMatchItem } from "utils/common/index";
const filterSymbols = computed(() => {
  return selectMatchItem(allSymbols.value, props.input, "symbol");
});

// 分类、
import {
  symbolAllPath,
  resSymbolAllPath,
  optionalQuery,
} from "api/symbols/index";
const listState = reactive({
  menu: [] as Array<any>,
  pathMap: {} as Record<string, any>,
  query: [] as Array<string>,
  loading: false,
});
const getQuery = async () => {
  const queryRes = await optionalQuery();
  listState.query = queryRes.data.map((item) => item.symbols);
};
onMounted(async () => {
  listState.loading = true;
  const allPathRes = await symbolAllPath();
  listState.menu = allPathRes.data;
  await getQuery();
  listState.loading = false;
});
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
// 各个分类下的已选品种数量
const getCount = (type: string) => {
  if (listState.pathMap[type]) {
    const filterList = listState.pathMap[type].filter((item: any) =>
      listState.query.includes(item.symbol)
    );
    return filterList.length;
  }
  return 0;
};

import { debounce, cloneDeep } from "lodash";
import { SessionSymbolInfo } from "@/types/chart/index";
import { delOptionalQuery, addOptionalQuery } from "api/symbols/index";
type SymbolListItem = SessionSymbolInfo & { loading: boolean };
const symbolList = ref<SymbolListItem[]>([]);
const showSymbols = ref(false);
const currentPath = ref("");
const getSymbols = (type: string) => {
  currentPath.value = listState.menu.find((e) => e.type === type).value;
  symbolList.value = listState.pathMap[type];
  showSymbols.value = true;
};
const btnClick = debounce(async (type: string, listItem: SymbolListItem) => {
  try {
    listItem.loading = true;
    switch (type) {
      case "cancel":
        await delOptionalQuery({ symbols: [listItem.symbol] });
        break;
      case "add":
        const mySymbols = cloneDeep(props.mySymbols);
        mySymbols.unshift({
          symbols: listItem.symbol,
        });
        const symbols = mySymbols.map((item, index) => {
          return {
            symbol: item.symbols,
            sort: index,
            topSort: item.topSort || "",
          };
        });
        await addOptionalQuery({ symbols });
        break;
      default:
        break;
    }
    await getQuery();
  } catch (error) {
    listItem.loading = false;
  } finally {
    listItem.loading = false;
  }
}, 20);
const getCheckType = (type: string) => {
  return listState.query.includes(type);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.el-scrollbar {
  width: 100%;
}
.searchList {
  height: calc(100% - 8px);
  width: 100%;
  margin-top: 8px;
  @include background_color("background-component");
}
.back {
  @include background_color("background-component");
  position: sticky;
  top: 0;
  &_title {
    display: flex;
    gap: 5px;
    font-size: var(--font-size);
    &:hover {
      cursor: pointer;
      @include font_color("primary");
    }
  }
}
</style>
