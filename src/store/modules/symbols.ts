import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { orderBy, uniq, compact, debounce } from "lodash";

import {
  allSymbols,
  allSymbolQuotes,
  reqOptionalQuery,
  optionalQuery,
} from "api/symbols/index";
import { TableDataKey } from "#/order";
import { ISessionSymbolInfo } from "@/types/chart/index";

import { useOrder } from "./order";
import { useSocket } from "./socket";

export const useSymbols = defineStore("symbols", () => {
  const orderStore = useOrder();
  const socketStore = useSocket();

  const symbols = ref<ISessionSymbolInfo[]>([]);

  const mySymbols = ref<reqOptionalQuery[]>([]);

  const selectSymbols = ref<string[]>([]);

  // 全部品种
  const getAllSymbol = async () => {
    const orderStore = useOrder();
    const res = await allSymbols();
    symbols.value = res.data;
    orderStore.currentSymbol = res.data[0].symbol;
    const quotes = await allSymbolQuotes();
    quotes.data.forEach((item) => {
      orderStore.currentQuotes[item.symbol] = item;
    });
  };

  const symbols_tradeAllow = computed(() => {
    return symbols.value.filter((e) => e.trade_allow === 1);
  });

  //自选品种
  const getMySymbols = async () => {
    const res = await optionalQuery();
    mySymbols.value = res.data;
  };
  const mySymbols_sort = computed(() => {
    return orderBy(mySymbols.value, ["sort"]);
  });

  // 除图表外需监听的品种
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
  const subSymbols = computed(() => {
    const arr = [
      ...orderSymbols.value,
      ...mySymbols.value.map((item) => item.symbols),
      ...selectSymbols.value,
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
          socketStore.subKlineQuote({ resolution: "1", symbol });
        });
      }
      if (removed.length) {
        removed.forEach((symbol) => {
          socketStore.unsubKlineQuote({ resolution: "1", symbol });
        });
      }
    }
  );

  return {
    getAllSymbol,
    symbols,
    mySymbols,
    selectSymbols,
    getMySymbols,
    mySymbols_sort,
    symbols_tradeAllow,
  };
});
