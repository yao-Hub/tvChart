import { useOrder } from "@/store/modules/order";
import * as types from "@/types/chart/index";
import { throttle } from "lodash";
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
      socketStore.socket.on(
        "quote",
        throttle((d: types.ISocketQuote) => {
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
              const high = bar.high;
              const low = bar.low;
              const open = bar.open || d.bid;
              const volume = bar.volume || 0;
              if (!bartime || bartime < d.ctm_ms) {
                const newHigh = !high || high < d.bid ? d.bid : high;
                const newLow = !low || low > d.bid ? d.bid : low;
                this.newbar[subscriberUID] = {
                  ...d,
                  time: d.ctm * 1000,
                  close: +d.bid,
                  high: +newHigh,
                  low: +newLow,
                  volume: volume + 1,
                  open: +open,
                };
                this.subscribed[UID].onRealtimeCallback(
                  this.newbar[subscriberUID]
                );
              }
            }
          }
        }, 200)
      );

      socketStore.socket.on("kline_new", (d: types.ISocketKlineNew) => {
        for (const UID in this.subscribed) {
          const item = this.subscribed[UID];
          const symbol = item.symbolInfo.name;
          const subscriberUID = UID.split("@")[1];
          const bar = this.newbar[subscriberUID];
          if (bar && d.symbol === symbol && +item.resolution == d.period_type) {
            const barTime = bar.time;
            d.klines.forEach((line) => {
              const dTime = line.ctm * 1000;
              if (!barTime || barTime <= dTime) {
                this.newbar[subscriberUID] = {
                  ...bar,
                  ...line,
                  time: dTime,
                };
                this.subscribed[UID].onRealtimeCallback(
                  this.newbar[subscriberUID]
                );
              }
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
