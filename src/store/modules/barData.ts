import { defineStore } from "pinia";
import { get, isNil, set, sortBy } from "lodash";

import * as library from "public/charting_library";
import * as types from "@/types/chart";

import { useQuotes } from "./quotes";
import { useSocket } from "./socket";

interface ISubSCribed {
  onRealtimeCallback: library.SubscribeBarsCallback;
  symbolInfo: library.LibrarySymbolInfo;
  resolution: string;
}

type Tbar = library.Bar & { time: number; ask?: number; bid?: number; };
interface IState {
  subscribed: Record<string, ISubSCribed>;
  newbar: Record<string, Tbar>;
  pageHidden: boolean;
  cooldownMap: Record<string, boolean>;
  qouteCache: Record<string, types.ISocketQuote>;
  cooldownTimerIds: Record<string, NodeJS.Timeout>;
}

type TAction = (symbol: string) => void;

// 1=1分钟，5=5分钟，15=15分钟 ，30=30分钟 ，60=1小时 ，240=4小时 ，1440=日线,10080=周线, 43200=月线
const periodMap = {
  "1": 1,
  "5": 5,
  "15": 15,
  "30": 30,
  "60": 60,
  "240": 240,
  "1D": 1440,
  "1W": 10080,
  "1M": 43200,
};

export const useBarData = defineStore("barData", {
  state: (): IState => {
    return {
      // 图表品种监听对象
      subscribed: {},
      // 最新k线数据（实时跳动的蜡烛图数据）
      newbar: {},
      pageHidden: false,
      // 冷却期映射
      cooldownMap: {},
      // 报价缓存 存储当前接收到的报价数据
      qouteCache: {},
      // 冷却期定时器
      cooldownTimerIds: {},
    };
  },
  actions: {
    // 更新k线图
    updateSubscribed(UID: string, data: Tbar) {
      if (this.subscribed[UID]) {
        this.subscribed[UID].onRealtimeCallback(data);
      }
    },

    // 监听k线和报价
    initSubLineAndQuote() {
      const socketStore = useSocket();
      const quotesStore = useQuotes();

      // 报价更新
      const updateQuote = (symbol: string) => {
        clearTimeout(this.cooldownTimerIds[symbol]);
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
        // 更新图表k线
        for (const UID in this.subscribed) {
          const item = this.subscribed[UID];
          const itemSymbol = item.symbolInfo.name;
          const bar = this.newbar[UID];
          if (bar && itemSymbol === symbol) {
            this.updateSubscribed(UID, { ...this.newbar[UID] });
          }
        }
      };

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
      const handleQuote: TAction = (symbol) => {
        // 处于冷却期
        if (this.cooldownMap[symbol]) return;
        // 进入冷却期
        this.cooldownMap[symbol] = true;
        // 设置x秒后解除冷却
        this.cooldownTimerIds[symbol] = setTimeout(() => {
          updateQuote(symbol);
        }, 300);
      };

      // 接收socket 发布
      socketStore.subQuote((d) => {
        const dSymbol = d.symbol;

        this.qouteCache[dSymbol] = d;

        // 订阅
        if (!actionMap[dSymbol]) {
          set(actionMap, [dSymbol], handleQuote);
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
              close: d.bid,
              high,
              low,
              volume: volume + 1,
              time: bartime,
            };
            this.newbar[UID] = { ...result };
          }
        }

        // 订阅 接收发布
        // 优化数据渲染
        requestAnimationFrame(() => actionMap[dSymbol](dSymbol));
      });

      socketStore.subKline((d) => {
        // 把之前的数据都先渲染
        requestAnimationFrame(() => updateQuote(d.symbol));

        for (const UID in this.subscribed) {
          const item = this.subscribed[UID];
          const symbol = item.symbolInfo.name;
          const nowBar = this.newbar[UID];
          const period = periodMap[item.resolution as keyof typeof periodMap];
          if (nowBar && d.symbol === symbol && period == d.period_type) {
            const nowbarTime = nowBar.time;
            const lines = sortBy(d.klines, ["ctm"]);
            const line = lines.pop();
            if (line) {
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
                this.newbar[UID] = { ...result };
                this.updateSubscribed(UID, result);
              }
            }
          }
        }
      });
    },

    // 取消某个图表下某个品种的订阅
    unsubscribed(UID: string) {
      delete this.subscribed[UID];
      delete this.newbar[UID];
    },

    // 移除某个图表的所有订阅
    removeChartSub(charId: string) {
      for (const UID in this.subscribed) {
        if (UID && UID.includes(charId)) {
          delete this.subscribed[UID];
        }
      }
    },
  },
});
