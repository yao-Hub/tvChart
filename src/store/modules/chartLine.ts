import { useOrder } from "@/store/modules/order";
import * as types from "@/types/chart/index";
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
      socketStore.subQuote((d) => {
        const oldQuote = orderStore.currentQuotes[d.symbol];
        const result = {
          ...oldQuote,
          ...d,
          close: d.bid,
        };
        orderStore.currentQuotes[d.symbol] = result;
        for (const UID in this.subscribed) {
          const item = this.subscribed[UID];
          const symbol = item.symbolInfo.name;
          const subscriberUID = UID.split("@")[1];
          const bar = this.newbar[subscriberUID];
          if (bar && d.symbol === symbol) {
            const bartime = bar.time;
            let high = bar.high;
            let low = bar.low;
            const volume = bar.volume || 0;
            if (!high || +high < +d.bid) {
              high = d.bid;
            }
            if (!low || +low > +d.bid) {
              low = d.bid;
            }
            let result = {
              ...d,
              ...bar,
              close: +d.bid,
              high: +high,
              low: +low,
              volume: volume + 1,
              time: bartime,
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
            for (let i = 0; i < d.klines.length; i++) {
              const line = d.klines[i];
              const { close, open, volume, high, low, ctm } = line;
              const dTime = ctm * 1000;
              let result = {
                close,
                open,
                volume,
                high,
                low,
                time: dTime,
              };
              if (!nowbarTime || nowbarTime <= dTime) {
                this.newbar[subscriberUID] = { ...result };
              }
              orderStore.currentQuotes[d.symbol]["close"] = close;
              orderStore.currentQuotes[d.symbol]["open"] = open;
              orderStore.currentQuotes[d.symbol]["high"] = high;
              orderStore.currentQuotes[d.symbol]["low"] = low;
              orderStore.currentQuotes[d.symbol]["volume"] = volume;
              this.subscribed[UID].onRealtimeCallback(result);
            }
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
