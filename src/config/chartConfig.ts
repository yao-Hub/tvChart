import { RESOLUTES } from "@/constants/common";
import { useChartLine } from "@/store/modules/chartLine";
import { useChartSub } from "@/store/modules/chartSub";
import { useSymbols } from "@/store/modules/symbols";
import { useTime } from "@/store/modules/time";
import dayjs from "dayjs";

import * as types from "@/types/chart";
import { ResLineInfo, klineHistory } from "api/kline/index";
import { cloneDeep, get, maxBy, orderBy } from "lodash";

const chartLineStore = useChartLine();
const chartSubStore = useChartSub();
const symbolsStore = useSymbols();

type Tunit = "day" | "week" | "month" | "hour" | "minute";
const countOptions: Record<string, Tunit> = {
  "1D": "day",
  "1W": "week",
  "1M": "month",
  "60": "hour",
  "240": "hour",
  "1": "minute",
  "5": "minute",
  "15": "minute",
  "30": "minute",
};

const config = {
  supports_search: true,
  supports_group_request: false,
  supports_marks: true,
  supports_timescale_marks: false,
  supports_time: true,
  exchanges: [],
  symbols_types: [],
  supported_resolutions: Object.keys(RESOLUTES),
};

// const formatTime = (time: number) => {
//   const hours = Math.floor(time / 60);
//   const second = time % 60;
//   return `${hours < 9 ? "0" : ""}${hours}${second < 9 ? "0" : ""}${second}`;
// };

// 商品切换还未初始化，但是数据已经先到达，存储最新的那个bar
let temBar: Record<string, ResLineInfo> = {};

export const datafeed = (id: string) => {
  let UID = "";
  let subId = "";
  return {
    onReady: (callback: Function) => {
      setTimeout(() => {
        callback(config);
      });
    },

    //商品配置
    resolveSymbol: (
      symbolName: string,
      onSymbolResolvedCallback: Function,
      onResolveErrorCallback: Function
    ) => {
      if (UID) {
        chartLineStore.unsubscribed(UID);
      }
      subId = "";
      UID = "";
      // 获取session
      const storeSymbolInfo = symbolsStore.symbols.find(
        (e) => e.symbol === symbolName
      );
      // const ttimes = storeSymbolInfo ? storeSymbolInfo.ttimes : [];
      // // 当时间为0 到 0时为关闭日
      // const times = flattenDeep(Object.values(ttimes)).filter(
      //   (obj) => symbolName === obj.symbol && obj.btime !== obj.etime
      // );
      // const grouptObj = groupBy(times, "week_day");
      // const timeArr = [];
      // for (const weekDay in grouptObj) {
      //   const tItem = grouptObj[weekDay];
      //   const fTime = tItem.reduce(
      //     (pre: types.TimeUnit, next: types.TimeUnit) => {
      //       const preSession = `${formatTime(pre.btime)}-${formatTime(
      //         pre.etime
      //       )}`;
      //       const endSession = `${formatTime(next.btime)}-${formatTime(
      //         next.etime
      //       )}`;
      //       return {
      //         btime: pre.btime,
      //         etime: next.etime,
      //         symbol: symbolName,
      //         week_day: Number(weekDay),
      //         session: `${preSession},${endSession}:${Number(weekDay) + 1}`,
      //       };
      //     }
      //   );
      //   const resultTs =
      //     fTime.session ||
      //     `${formatTime(fTime.btime)}-${formatTime(fTime.etime)}:${
      //       Number(weekDay) + 1
      //     }`;
      //   timeArr.push(resultTs);
      // }
      // const session = timeArr.join("|");
      const timeStore = useTime();

      const symbol_stub = {
        name: symbolName,
        description: storeSymbolInfo?.description || "-",
        visible_plots_set: "ohlcv",
        minmov: 1, // 纵坐标比例
        minmov2: 0,
        pricescale: Math.pow(10, storeSymbolInfo?.digits || 2), // 纵坐标小数位数
        // session,
        session: "24x7",
        // has_empty_bars: true,
        ticker: symbolName,
        timezone: timeStore.settedTimezone,
        // type: "cfd",
        has_intraday: true, // 分钟数据
        has_daily: true, // 日k线数据
        has_weekly_and_monthly: true, // 月，周数据
        supported_resolutions: [
          "D",
          "W",
          "M",
          "60",
          "240",
          "1",
          "5",
          "15",
          "30",
        ],
        exchange: storeSymbolInfo?.path,
      };
      setTimeout(() => {
        onSymbolResolvedCallback(symbol_stub);
      });
    },

    //渲染历史数据
    getBars: (
      symbolInfo: types.ITVSymbolInfo,
      resolution: keyof typeof types.Periods,
      periodParams: types.PeriodParams,
      onHistoryCallback: Function,
      onErrorCallback: Function
    ) => {
      try {
        function checkString(str: string) {
          const regex = /[DWM]/;
          return regex.test(str);
        }

        let count = periodParams.countBack;
        // periodParams.countBack 长度不够导致数据缺失
        const to = dayjs.unix(periodParams.to);
        const from = dayjs.unix(periodParams.from);
        const diffType = countOptions[resolution];
        count = to.diff(from, diffType);
        const updata = {
          period_type: types.Periods[resolution] || resolution,
          symbol: symbolInfo.name,
          count,
          limit_ctm: periodParams.to,
        };
        klineHistory(updata)
          .then((res: any) => {
            const data = res.data;
            if (data.length === 0) {
              onHistoryCallback([], {
                noData: true,
              });
              return;
            }
            const orderBy_data = orderBy(data, "ctm");
            const bars = orderBy_data.map((item) => {
              const time = checkString(resolution)
                ? (item.ctm + 8 * 3600) * 1000
                : item.ctm * 1000;
              return {
                ...item,
                time,
                // time: item.ctm * 1000,
              };
            });
            const bar = maxBy(bars, "ctm");
            if (bar) {
              const barTime = bar.time;
              if (subId) {
                const newbarTime = get(chartLineStore.newbar, [subId, "time"]);
                if (!newbarTime || barTime > newbarTime) {
                  chartLineStore.newbar[subId] = {
                    ...bar,
                  };
                }
              }
              temBar[id] = cloneDeep(bar);
            }
            setTimeout(() => {
              onHistoryCallback(bars);
            }, 0);
          })
          .catch((error) => {
            onErrorCallback("error", {
              noData: true,
            });
          });
      } catch (error) {
        onHistoryCallback([], {
          noData: true,
        });
      }
    },

    //实时更新
    subscribeBars: (
      symbolInfo: types.ITVSymbolInfo,
      resolution: string,
      onRealtimeCallback: Function,
      subscriberUID: string,
      onResetCacheNeededCallback: Function
    ) => {
      const endBar = temBar[id];
      // 初始化没有UID
      if (!UID && endBar) {
        chartLineStore.newbar[subscriberUID] = cloneDeep(endBar);
      }
      // 更改了图表周期或者商品之后再次触发
      if (UID && endBar) {
        chartLineStore.newbar[subscriberUID] = cloneDeep(endBar);
      }
      UID = `${id}@${subscriberUID}`;
      subId = subscriberUID;

      const subscribed = chartLineStore.subscribed;
      for (const ID in subscribed) {
        const chartId = ID.split("@")[0];
        if (chartId === id) {
          chartLineStore.unsubscribed(ID);
        }
      }

      chartLineStore.subscribed[UID] = {
        onRealtimeCallback,
        resolution,
        symbolInfo,
      };
      chartSubStore.subChartKlineQuote({
        subscriberUID,
        symbolInfo,
        resolution,
      });
      symbolsStore.chartSymbols.push(symbolInfo.name);
    },

    //取消订阅,撤销掉某条线的实时更新
    unsubscribeBars: (subscriberUID: string) => {
      // chartSubStore.unsubChartKlineQuote(subscriberUID);
    },

    // 查找商品（商品）
    // searchSymbols: (
    //   userInput: string,
    //   exchange: string,
    //   symbolType: string,
    //   onResultReadyCallback: Function
    // ) => {
    //   // 模糊匹配
    //   const regex = new RegExp(userInput.split("").join(".*"), "i");
    //   const matches = symbolsStore.symbols.map((item, index) => {
    //     const exchangeMatch = regex.test(item.path);
    //     const symbolMatch = regex.test(item.symbol);
    //     return {
    //       index,
    //       count: (exchangeMatch ? 1 : 0) + (symbolMatch ? 1 : 0),
    //     };
    //   });

    //   // 匹配度排列
    //   matches.sort((a, b) => b.count - a.count);
    //   const sortedIndices = matches.map((match) => match.index);
    //   const sortedArr = sortedIndices.map(
    //     (index) => symbolsStore.symbols[index]
    //   );

    //   const targetList = sortedArr.map((item: types.ISessionSymbolInfo) => {
    //     return {
    //       symbol: item.symbol,
    //       full_name: item.symbol,
    //       description: item.path,
    //       exchange: item.path,
    //       ticker: item.symbol,
    //       force_session_rebuild: true,
    //     };
    //   });
    //   onResultReadyCallback(targetList);
    // },
  };
};
