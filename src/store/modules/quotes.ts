import * as types from "#/chart/index";
import { defineStore } from "pinia";
import { round } from "utils/common/index";
import { ref } from "vue";

interface IClass {
  [value: string]: {
    ask: string;
    bid: string;
  };
}

export const useQuotes = defineStore("qoutes", () => {
  const qoutes = ref<Record<string, types.IQuote>>({});
  const quotesClass = ref<IClass>({});

  // 设置ask,bid涨跌颜色
  const setClass = (quote: types.ISocketQuote) => {
    const { symbol, ask, bid } = quote;
    const oldQuote = qoutes.value[symbol];
    let result = {
      ask: "",
      bid: "",
    };
    if (oldQuote) {
      const oldAsk = oldQuote.ask;
      const oldBid = oldQuote.bid;
      if (oldAsk && ask) {
        result.ask = oldAsk > ask ? "sellWord" : "buyWord";
      }
      if (oldBid && bid) {
        result.bid = oldBid > bid ? "sellWord" : "buyWord";
      }
    }
    quotesClass.value[symbol] = result;
  };

  // 日变化
  const getVariation = (symbol: string) => {
    const result = {
      class: "",
      value: "-",
    };
    const quote = qoutes.value[symbol];
    if (quote) {
      const close = quote.close;
      const open = quote.open;
      if (close && open) {
        const variation = round(((close - open) / open) * 100, 2);
        result.value = `${variation}%`;
        result.class = +variation > 0 ? " buyWord" : " sellWord";
      }
    }
    return result;
  };

  function $reset() {
    qoutes.value = {};
    quotesClass.value = {};
  }

  return {
    qoutes,
    quotesClass,
    setClass,
    getVariation,
    $reset,
  };
});
