<template>
  <div>
    <div v-if="!input">
      <Block
        v-if="!showSymbols"
        v-for="item in listState.menu"
        :title="item.value"
        type="count"
        :total="getTotal(item.type)"
        :count="getCount(item.type)"
        @blockClick="getSymbols(item.type)"
      ></Block>

      <div v-else>
        <Block>
          <template #title>
            <div class="back" @click="() => (showSymbols = false)">
              <LeftOutlined />
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
      </div>
    </div>

    <Block
      v-else
      v-for="item in filterSymbols"
      :title="item.symbol"
      type="radio"
      :loading="item.loading"
      :ifChecked="getCheckType(item.symbol)"
      @btnClick="(e) => btnClick(e, item)"
    >
    </Block>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref } from "vue";
import { LeftOutlined } from "@ant-design/icons-vue";
import Block from "./Block.vue";

const props = defineProps<{ input: string }>();

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
});
const getQuery = async () => {
  const queryRes = await optionalQuery();
  listState.query = queryRes.data;
};
(async function () {
  const allPathRes = await symbolAllPath();
  listState.menu = allPathRes.data;
  getQuery();
})();
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

import { debounce } from "lodash";
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
const btnClick = debounce(async (type: string, item: SymbolListItem) => {
  item.loading = true;
  switch (type) {
    case "cancel":
      await delOptionalQuery({ symbols: [item.symbol] });
      break;
    case "add":
      await addOptionalQuery({ symbols: [item.symbol] });
      break;
    default:
      break;
  }
  await getQuery();
  item.loading = false;
}, 200);
const getCheckType = (type: string) => {
  return listState.query.includes(type);
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";
.back {
  display: flex;
  gap: 5px;
}
.back:hover {
  cursor: pointer;
  @include font_color("primary");
}
</style>
