import { compact, debounce, orderBy, uniq } from "lodash";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

import { TableDataKey } from "#/order";
import { ISessionSymbolInfo } from "@/types/chart/index";
import { allSymbols, optionalQuery, reqOptionalQuery } from "api/symbols/index";

import { useOrder } from "./order";
import { useQuotes } from "./quotes";
import { useSocket } from "./socket";

export const useSymbols = defineStore("symbols", () => {
  const orderStore = useOrder();
  const socketStore = useSocket();
  const quotesStore = useQuotes();

  // 全部品种
  const symbols = ref<ISessionSymbolInfo[]>([]);

  // 自选品种;
  const mySymbols = ref<reqOptionalQuery[]>([]);

  // 下单时选择的品种
  const selectSymbols = ref<string[]>([]);

  // 图表的品种
  const chartSymbols = ref<string[]>([]);

  // 可交易品种
  const symbols_tradeAllow = computed(() => {
    return symbols.value.filter((e) => e.trade_allow === 1);
  });

  // 有报价的品种
  const haveQuoteSymbols = computed(() => {
    const result = symbols.value.filter((item) => {
      const quote = quotesStore.initAllQoutes[item.symbol];
      return quote && (quote.ask || quote.bid);
    });
    return result;
  });

  // 全部品种
  const getAllSymbol = async () => {
    const res = await allSymbols();
    symbols.value = res.data || [];
  };

  // 自选品种
  const getMySymbols = async () => {
    const res = await optionalQuery();
    mySymbols.value = res.data || [];
  };

  // 排序自选品种
  const mySymbols_sort = computed(() => {
    return orderBy(mySymbols.value, ["sort"]);
  });

  // 订单区域涉及的品种
  let orderSymbols = ref<string[]>([]);
  watch(
    () => orderStore.orderData,
    debounce(() => {
      const orderData = orderStore.orderData;
      const arr = new Set<string>();
      let i: TableDataKey;
      for (i in orderData) {
        const itemSymbols = orderData[i].map((item) => item.symbol);
        itemSymbols.forEach((symbol) => arr.add(symbol));
      }
      orderSymbols.value = Array.from(arr);
    }, 200),
    { deep: true }
  );

  // 需要监听的品种
  const subSymbols = computed(() => {
    const arr = [
      ...orderSymbols.value,
      ...mySymbols.value.map((item) => item.symbol),
      ...selectSymbols.value,
      ...chartSymbols.value,
    ];
    const result = uniq(compact(arr)).sort();
    return result;
  });
  watch(
    () => subSymbols.value,
    (nextList, preList) => {
      const preSet = new Set(preList);
      const nextSet = new Set(nextList);
      // 增加的品种;
      const added = nextList.filter((item) => !preSet.has(item));
      // 减少的品种;
      const removed = preList.filter((item) => !nextSet.has(item));
      if (added.length) {
        added.forEach((symbol) => {
          socketStore.emitKlineQuote({ resolution: "1", symbol });
        });
      }
      if (removed.length) {
        removed.forEach((symbol) => {
          socketStore.unsubKlineQuote({ resolution: "1", symbol });
        });
      }
    }
  );

  function $reset() {
    symbols.value = [];
    mySymbols.value = [];
    selectSymbols.value = [];
    chartSymbols.value = [];
    orderSymbols.value = [];
  }

  return {
    getAllSymbol,
    symbols,
    mySymbols,
    selectSymbols,
    chartSymbols,
    getMySymbols,
    mySymbols_sort,
    symbols_tradeAllow,
    haveQuoteSymbols,
    $reset,
  };
});
