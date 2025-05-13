import { ref } from "vue";
import { defineStore } from "pinia";
import Decimal from "decimal.js";

import { round } from "utils/common/index";
import * as types from "@/types/chart";

import { allSymbolQuotes } from "api/symbols/index";

import { useSymbols } from "./symbols";

interface IClass {
  [value: string]: {
    ask: string;
    bid: string;
  };
}

export const useQuotes = defineStore("qoutes", () => {
  const qoutes = ref<Record<string, types.IQuote>>({});
  const quotesClass = ref<IClass>({});
  const initAllQoutes = ref<Record<string, types.IQuote>>({});

  // 所有商品报价
  const getAllSymbolQuotes = async () => {
    const res = await allSymbolQuotes();
    res.data.forEach((item) => {
      qoutes.value[item.symbol] = item;
      initAllQoutes.value[item.symbol] = item;
    });
  };

  // 设置ask,bid涨跌颜色
  const setClass = (quote: types.ISocketQuote) => {
    const { symbol = "", ask, bid } = quote;
    if (!symbol) {
      return;
    }
    const oldQuote = qoutes.value[symbol];
    let result = {
      ask: "",
      bid: "",
    };
    if (oldQuote) {
      const oldAsk = oldQuote.ask;
      const oldBid = oldQuote.bid;
      if (oldAsk && ask) {
        if (oldAsk > ask) {
          result.ask = "sellWord";
        }
        if (oldAsk < ask) {
          result.ask = "buyWord";
        }
      }
      if (oldBid && bid) {
        if (oldBid > bid) {
          result.bid = "sellWord";
        }
        if (oldBid < bid) {
          result.bid = "buyWord";
        }
      }
    }
    quotesClass.value[symbol] = result;
  };

  // 日变化
  const getVariation = (symbol: string) => {
    const result = {
      numerator: "-",
      class: "",
      value: "-",
    };
    const quote = qoutes.value[symbol];
    if (quote) {
      const close = quote.close;
      const open = quote.open;
      if (close && open) {
        const variation = round(((close - open) / open) * 100, 2);
        result.numerator = (close - open).toFixed(2);
        result.value = `${variation}%`;
        result.class = +variation > 0 ? " buyWord" : " sellWord";
      }
    }
    return result;
  };

  // 点差
  const getSpread = (symbol: string) => {
    const quote = qoutes.value[symbol];
    const info = useSymbols().symbols.find((e) => e.symbol === symbol);
    if (quote && info) {
      const ask = quote.ask;
      const bid = quote.bid;
      const digits = info.digits;
      const dask = new Decimal(ask);
      const dbid = new Decimal(bid);
      return dask.minus(dbid).abs().times(new Decimal(10).pow(digits));
    }
    return "-";
  };

  function $reset() {
    qoutes.value = {};
    quotesClass.value = {};
    initAllQoutes.value = {};
  }

  return {
    qoutes,
    quotesClass,
    setClass,
    getVariation,
    getAllSymbolQuotes,
    initAllQoutes,
    getSpread,
    $reset,
  };
});
