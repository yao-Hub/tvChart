import dayjs from "dayjs";
import Decimal from "decimal.js";

import { useTime } from "@/store/modules/time";
import { useQuotes } from "@/store/modules/quotes";
import { useSymbols } from "@/store/modules/symbols";

import { ISymbolListDataSource } from "@/types/common";
export function useSymbolList() {
  const quotesStore = useQuotes();
  const symbolsStore = useSymbols();

  const getTime = (symbol: string) => {
    const quotes = quotesStore.qoutes;
    const target = quotes[symbol];
    if (target) {
      const timezone = useTime().settedTimezone;
      const time = target.ctm_ms;
      return dayjs(time).tz(timezone).format("HH:mm:ss");
    }
    return "-";
  };

  const getClass = (rowData: ISymbolListDataSource, type: "ask" | "bid") => {
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
        const result = target[type];
        return new Decimal(result).toFixed(digits);
      }
      return target[type] || "-";
    }
    return "-";
  };
  return { getTime, getClass, getPrice };
}
