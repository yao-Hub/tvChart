import * as types from "@/types/chart";
import { get, isNil, set, sortBy } from "lodash";
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
  pageHidden: boolean;
  cooldownMap: Record<string, boolean>;
  qouteCache: Record<string, types.ISocketQuote>;
}

type TAction = (symbol: string) => void;
export const useChartLine = defineStore("chartLine", {
  state: (): IState => {
    return {
      subscribed: {},
      newbar: {},
      pageHidden: false,
      cooldownMap: {},
      qouteCache: {},
    };
  },
  actions: {
    updateSubscribed(UID: string, data: Tbar) {
      if (this.subscribed[UID]) {
        this.subscribed[UID].onRealtimeCallback(data);
      }
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
      const updateQoute: TAction = (symbol) => {
        // 处于冷却期
        if (this.cooldownMap[symbol]) return;
        // 进入冷却期
        this.cooldownMap[symbol] = true;
        // 设置x秒后解除冷却
        let timerId = setTimeout(() => {
          clearTimeout(timerId);
          this.cooldownMap[symbol] = false;
          const oldQuote = quotesStore.qoutes[symbol];
          const cache = this.qouteCache[symbol];
          if (!cache) {
            return;
          }
          // 涨跌颜色
          quotesStore.setClass(cache);
          // 发送报价全局
          quotesStore.qoutes[symbol] = {
            ...oldQuote,
            ...cache,
            close: cache.bid,
            high: setHigh(cache.bid, get(oldQuote, "high")),
            low: setHigh(cache.bid, get(oldQuote, "low")),
          };
          // 更新k线
          for (const UID in this.subscribed) {
            const item = this.subscribed[UID];
            const itemSymbol = item.symbolInfo.name;
            const bar = this.newbar[UID];
            if (bar && itemSymbol === symbol) {
              this.updateSubscribed(UID, { ...this.newbar[UID] });
            }
          }
        }, 300);
      };

      // 接收socket 发布
      socketStore.subQuote((d) => {
        const dSymbol = d.symbol;

        this.qouteCache[dSymbol] = d;

        // 订阅
        if (!actionMap[dSymbol]) {
          set(actionMap, [dSymbol], updateQoute);
        }

        // 图表最新k柱的信息处理
        for (const UID in this.subscribed) {
          const item = this.subscribed[UID];
          const itemSymbol = item.symbolInfo.name;
          const bar = this.newbar[UID];
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
            this.newbar[UID] = { ...result };
          }
        }

        // 订阅 接收发布 方式一
        if (!document.hidden) {
          // 优化页面渲染
          requestAnimationFrame(() => actionMap[dSymbol](dSymbol));
        } else {
          actionMap[dSymbol](dSymbol);
        }

        // 方式二 不是当前标签页不渲染数据节省内存
        // const rafId = requestAnimationFrame(async () => {
        //   if (this.pageHidden && !document.hidden) {
        //     this.pageHidden = false;
        //     await quotesStore.getAllSymbolQuotes();
        //   }
        //   actionMap[dSymbol](dSymbol, d);
        // });
        // if (document.hidden) {
        //   this.pageHidden = true;
        //   cancelAnimationFrame(rafId);
        // }
      });

      socketStore.subKline((d) => {
        for (const UID in this.subscribed) {
          const item = this.subscribed[UID];
          const symbol = item.symbolInfo.name;
          const nowBar = this.newbar[UID];
          if (
            nowBar &&
            d.symbol === symbol &&
            +item.resolution == d.period_type
          ) {
            const nowbarTime = nowBar.time;
            const lines = sortBy(d.klines, ["ctm"]);
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
              this.newbar[UID] = { ...result };
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
      delete this.newbar[UID];
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
