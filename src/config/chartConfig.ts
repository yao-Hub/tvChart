import { flattenDeep, groupBy, orderBy, get, cloneDeep, maxBy } from "lodash";
import moment from "moment";
import { klineHistory, ReqLineInfo, ResLineInfo } from "api/kline/index";
import * as types from "@/types/chart/index";
import { useChartSub } from "@/store/modules/chartSub";
import { useChartLine } from "@/store/modules/chartLine";
import { RESOLUTES } from "@/constants/common";

const chartLineStore = useChartLine();
const chartSubStore = useChartSub();

const countOptions: any = {
  "1D": "days",
  "1W": "weeks",
  "1M": "months",
  "60": "hours",
  "240": ["hours", 4],
  "1": "minutes",
  "5": ["minutes", 5],
  "15": ["minutes", 15],
  "30": ["minutes", 30],
};

const config = {
  supports_search: true,
  supports_group_request: false,
  supports_marks: false,
  supports_timescale_marks: false,
  supports_time: true,
  exchanges: [],
  symbols_types: [],
  supported_resolutions: Object.keys(RESOLUTES),
};

const formatToSeesion = (time: number) => {
  const hours = Math.floor(time / 60);
  const second = time % 60;
  return `${hours < 9 ? "0" : ""}${hours}${second < 9 ? "0" : ""}${second}`;
};

function hasEmptyArrayValue(map: Map<string, any>) {
  for (const [key, value] of map) {
    if (Array.isArray(value) && value.length === 0) {
      return key;
    }
  }
  return false;
}

// 优化当前k线图加载
interface IInfoCache {
  nowSymbol: string;
  temSymbol: string;
  temResolution: string;
  nowResolution: string;
}
interface IBarsCache {
  [key: string]: Map<string, ResLineInfo[]>;
}
const infoCache: Record<string, Partial<IInfoCache>> = {};
const barsCache: IBarsCache = {};
let temBar: Record<string, ResLineInfo> = {};
function getCacheBars(data: ReqLineInfo, id: string): Promise<ResLineInfo[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const fkey = `${data.symbol}#${data["period_type"]}`;
      const skey = `${data["limit_ctm"]}`;
      const cache = barsCache[fkey];
      if (!cache) {
        barsCache[fkey] = new Map();
        const res = await klineHistory(data);
        barsCache[fkey].set(skey, res.data);
        resolve(res.data);
        return;
      }
      const bar = barsCache[fkey].get(skey);
      if (bar) {
        resolve(bar);
        return;
      }
      const emptyKey = hasEmptyArrayValue(barsCache[fkey]);
      if (emptyKey) {
        const { nowSymbol, temSymbol, temResolution, nowResolution } =
          infoCache[id];
        if (
          !nowSymbol ||
          (temSymbol === nowSymbol && temResolution === nowResolution)
        ) {
          resolve([]);
          return;
        }
        if (temSymbol !== nowSymbol || temResolution !== nowResolution) {
          barsCache[fkey].delete(emptyKey);
        }
        infoCache[id].nowResolution = data.period_type.toString();
        infoCache[id].nowSymbol = data.symbol;
      }
      const res = await klineHistory(data);
      barsCache[fkey].set(skey, res.data);
      resolve(res.data);
    } catch (error) {
      reject([]);
    }
  });
}

export const datafeed = (id: string) => {
  let UID = "";
  let subId = "";
  return {
    onReady: (callback: Function) => {
      infoCache[id] = {};
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
      const storeSymbolInfo = chartSubStore.symbols.find(
        (e) => e.symbol === symbolName
      );
      const ttimes = storeSymbolInfo ? storeSymbolInfo.ttimes : [];
      // 当时间为0 到 0时为关闭日
      const times = flattenDeep(Object.values(ttimes)).filter(
        (obj) => symbolName === obj.symbol && obj.btime !== obj.etime
      );
      const grouptObj = groupBy(times, "week_day");
      const timeArr = [];
      for (const weekDay in grouptObj) {
        const tItem = grouptObj[weekDay];
        const fTime = tItem.reduce(
          (pre: types.TimeUnit, next: types.TimeUnit) => {
            const preSession = `${formatToSeesion(pre.btime)}-${formatToSeesion(
              pre.etime
            )}`;
            const endSession = `${formatToSeesion(
              next.btime
            )}-${formatToSeesion(next.etime)}`;
            return {
              btime: pre.btime,
              etime: next.etime,
              symbol: symbolName,
              week_day: Number(weekDay),
              session: `${preSession},${endSession}:${Number(weekDay) + 1}`,
            };
          }
        );
        const resultTs =
          fTime.session ||
          `${formatToSeesion(fTime.btime)}-${formatToSeesion(fTime.etime)}:${
            Number(weekDay) + 1
          }`;
        timeArr.push(resultTs);
      }
      const session = timeArr.join("|");
      const symbol_stub = {
        name: symbolName,
        description: storeSymbolInfo?.description || "-",
        visible_plots_set: false,
        minmov: 1, // 纵坐标比例
        minmov2: 0,
        pricescale: Math.pow(10, storeSymbolInfo?.digits || 2), // 纵坐标小数位数
        session,
        ticker: symbolName,
        timezone: "Asia/Hong_Kong",
        type: "cfd",
        has_intraday: true, // 分钟数据
        // has_daily: true, // 日k线数据
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

    //实时更新
    subscribeBars: (
      symbolInfo: types.ITVSymbolInfo,
      resolution: string,
      onRealtimeCallback: Function,
      subscriberUID: string,
      onResetCacheNeededCallback: Function
    ) => {
      if (!UID && temBar[id]) {
        const endBar = temBar[id];
        chartLineStore.newbar[subscriberUID] = cloneDeep(endBar);
        delete temBar[id];
      }
      UID = `${id}@${subscriberUID}`;
      subId = subscriberUID;
      chartLineStore.subscribed[UID] = {
        onRealtimeCallback,
        resolution,
        symbolInfo,
      };
      chartSubStore.subKlineQuote({
        subscriberUID,
        symbolInfo,
        resolution,
      });
    },

    //渲染历史数据
    getBars: (
      symbolInfo: types.ITVSymbolInfo,
      resolution: string,
      periodParams: types.PeriodParams,
      onHistoryCallback: Function,
      onErrorCallback: Function
    ) => {
      try {
        let count = periodParams.countBack;
        // 第一次请求会出现数据请求长度不够导致数据缺失
        if (periodParams.firstDataRequest) {
          const to = moment.unix(periodParams.to);
          const from = moment.unix(periodParams.from);
          const option = countOptions[resolution];
          let diffType;
          let gap = 1;
          if (typeof option === "string") {
            diffType = option;
          } else {
            diffType = option[0];
            gap = option[1];
          }
          count = Math.ceil(to.diff(from, diffType) / gap);
        }
        const updata = {
          period_type:
            types.Periods[resolution as keyof typeof types.Periods] ||
            resolution,
          symbol: symbolInfo.name,
          count: count,
          limit_ctm: periodParams.to,
        };
        getCacheBars(updata, id).then((res) => {
          if (res.length === 0) {
            onHistoryCallback([]);
            return;
          }
          const reverse_data = orderBy(res, "ctm");
          const bars = reverse_data.map((item) => {
            return {
              ...item,
              time: item.ctm * 1000,
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
            } else {
              temBar[id] = cloneDeep(bar);
            }
          }
          setTimeout(() => {
            onHistoryCallback(bars);
          });
        });
      } catch (error) {
        onErrorCallback();
      }
    },

    //取消订阅,撤销掉某条线的实时更新
    unsubscribeBars: (subscriberUID: string) => {
      // chartSubStore.unsubKlineQuote(subscriberUID);
    },

    // 查找品种（商品）
    // searchSymbols: (
    //   userInput: string,
    //   exchange: string,
    //   symbolType: string,
    //   onResultReadyCallback: Function
    // ) => {
    //   // 模糊匹配
    //   const regex = new RegExp(userInput.split("").join(".*"), "i");
    //   const matches = chartSubStore.symbols.map((item, index) => {
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
    //     (index) => chartSubStore.symbols[index]
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
