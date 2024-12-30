import { useOrder } from "@/store/modules/order";
import * as types from "@/types/chart/index";
import { sortBy } from "lodash";
import { defineStore } from "pinia";
import { useSocket } from "./socket";
interface ISubSCribed {
  onRealtimeCallback: Function;
  symbolInfo: types.ITVSymbolInfo;
  resolution: string;
}

interface IState {
  subscribed: Record<string, ISubSCribed>;
  newbar: Record<
    string,
    Partial<types.ISocketQuote> & Partial<types.IQuote> & { time: number }
  >;
}
export const useChartLine = defineStore("chartLine", {
  state: (): IState => {
    return {
      subscribed: {},
      newbar: {},
    };
  },
  actions: {
    initSubLineAndQuote() {
      const socketStore = useSocket();
      const orderStore = useOrder();

      const setHigh = (bid: number, high?: number) => {
        if (!high) {
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
        if (!low) {
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

      socketStore.subQuote((d) => {
        const oldQuote = orderStore.currentQuotes[d.symbol];
        const result = {
          ...oldQuote,
          ...d,
          close: d.bid,
          high: setHigh(d.bid, oldQuote.high),
          low: setHigh(d.bid, oldQuote.low),
        };
        orderStore.currentQuotes[d.symbol] = result;
        for (const UID in this.subscribed) {
          const item = this.subscribed[UID];
          const symbol = item.symbolInfo.name;
          const subscriberUID = UID.split("@")[1];
          const bar = this.newbar[subscriberUID];
          if (bar && d.symbol === symbol) {
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
              time: d.ctm * 1000,
            };
            if (!bartime || bartime < d.ctm * 1000) {
              result.time = d.ctm * 1000;
            }
            this.newbar[subscriberUID] = { ...result };
            this.subscribed[UID].onRealtimeCallback(result);
          }
        }
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
            const line = lines.slice(-1)[0];
            const { close, open, volume, high, low, ctm } = line;
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
            this.subscribed[UID].onRealtimeCallback(result);
            orderStore.currentQuotes[d.symbol]["close"] = close;
            orderStore.currentQuotes[d.symbol]["open"] = open;
            orderStore.currentQuotes[d.symbol]["high"] = high;
            orderStore.currentQuotes[d.symbol]["low"] = low;
            orderStore.currentQuotes[d.symbol]["volume"] = volume;
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
