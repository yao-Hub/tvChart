import * as types from "@/types/chart/index";
import { get, isNil, set, sortBy, throttle } from "lodash";
import { defineStore } from "pinia";
import { useQuotes } from "./quotes";
import { useSocket } from "./socket";
interface ISubSCribed {
  onRealtimeCallback: Function;
  symbolInfo: types.ITVSymbolInfo;
  resolution: string;
}

type Tbar = Partial<types.ISocketQuote> &
  Partial<types.IQuote> & { time: number };
interface IState {
  subscribed: Record<string, ISubSCribed>;
  newbar: Record<string, Tbar>;
}

type TAction = (symbol: string, qData: types.ISocketQuote) => void;
export const useChartLine = defineStore("chartLine", {
  state: (): IState => {
    return {
      subscribed: {},
      newbar: {},
    };
  },
  actions: {
    updateSubscribed(UID: string, data: Tbar) {
      setTimeout(() => {
        if (this.subscribed[UID]) {
          this.subscribed[UID].onRealtimeCallback(data);
        }
      });
    },

    initSubLineAndQuote() {
      const socketStore = useSocket();
      const quotesStore = useQuotes();

      const setHigh = (bid: number, high?: number) => {
        if (isNil(high)) {
          return bid;
        }
        if (high < bid) {
          return bid;
        }
        if (high) {
          return high;
        }
        return bid;
      };
      const setLow = (bid: number, low?: number) => {
        if (isNil(low)) {
          return bid;
        }
        if (low > bid) {
          return bid;
        }
        if (low) {
          return low;
        }
        return bid;
      };

      // 商品更新订阅集合
      const actionMap: Record<string, TAction> = {};

      // 订阅接收处理
      const updateQoute: TAction = throttle(
        (symbol, qData) => {
          const oldQuote = quotesStore.qoutes[symbol];
          // 涨跌颜色
          quotesStore.setClass(qData);
          // 发送报价全局
          quotesStore.qoutes[symbol] = {
            ...oldQuote,
            ...qData,
            close: qData.bid,
            high: setHigh(qData.bid, get(oldQuote, "high")),
            low: setHigh(qData.bid, get(oldQuote, "low")),
          };
          // 更新k线
          for (const UID in this.subscribed) {
            const item = this.subscribed[UID];
            const itemSymbol = item.symbolInfo.name;
            const subscriberUID = UID.split("@")[1];
            const bar = this.newbar[subscriberUID];
            if (bar && itemSymbol === symbol) {
              this.updateSubscribed(UID, { ...this.newbar[subscriberUID] });
            }
          }
        },
        300,
        { trailing: true }
      );

      // 接收socket 发布
      socketStore.subQuote((d) => {
        const dSymbol = d.symbol;
        // 订阅
        if (!actionMap[dSymbol]) {
          set(actionMap, [dSymbol], updateQoute);
        }

        // 图表最新k柱的信息处理
        for (const UID in this.subscribed) {
          const item = this.subscribed[UID];
          const itemSymbol = item.symbolInfo.name;
          const subscriberUID = UID.split("@")[1];
          const bar = this.newbar[subscriberUID];
          if (bar && itemSymbol === dSymbol) {
            const bartime = bar.time;
            const high = setHigh(d.bid, bar.high);
            const low = setLow(d.bid, bar.low);
            const volume = bar.volume || 0;
            let result = {
              open: bar.open,
              ask: d.ask,
              bid: d.bid,
              close: +d.bid,
              high: +high,
              low: +low,
              volume: volume + 1,
              time: bartime,
            };
            this.newbar[subscriberUID] = { ...result };
          }
        }

        // 触发订阅
        actionMap[dSymbol](dSymbol, d);
      });

      socketStore.subKline((d) => {
        for (const UID in this.subscribed) {
          const item = this.subscribed[UID];
          const symbol = item.symbolInfo.name;
          const subscriberUID = UID.split("@")[1];
          const nowBar = this.newbar[subscriberUID];
          if (
            nowBar &&
            d.symbol === symbol &&
            +item.resolution == d.period_type
          ) {
            const nowbarTime = nowBar.time;
            const lines = sortBy(d.klines, ["ctm"]);
            // const line = lines.slice(-1)[0];
            lines.forEach((line) => {
              const { close, open, high, low, ctm, volume } = line;
              const dTime = ctm * 1000;
              const result = {
                close,
                open,
                volume,
                high,
                low,
                time: nowbarTime,
              };
              if (!nowbarTime || nowbarTime < dTime) {
                result.time = dTime;
              }
              this.newbar[subscriberUID] = { ...result };
              this.updateSubscribed(UID, result);
              quotesStore.qoutes[d.symbol]["close"] = close;
              quotesStore.qoutes[d.symbol]["open"] = open;
              quotesStore.qoutes[d.symbol]["high"] = high;
              quotesStore.qoutes[d.symbol]["low"] = low;
              quotesStore.qoutes[d.symbol]["volume"] = volume;
            });
          }
        }
      });
    },

    unsubscribed(UID: string) {
      delete this.subscribed[UID];
    },

    removeChartSub(charId: string) {
      for (const UID in this.subscribed) {
        if (UID && UID.includes(charId)) {
          delete this.subscribed[UID];
        }
      }
    },
  },
});
