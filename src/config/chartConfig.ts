import dayjs from "dayjs";
import { cloneDeep, flattenDeep, groupBy, maxBy, orderBy } from "lodash";

import * as types from "@/types/chart";
import { ReqLineInfo, ResLineInfo, klineHistory } from "api/kline/index";

import { RESOLUTES } from "@/constants/common";
import { checkDMW } from "@/utils/common";
import SynchronizeTask from "@/utils/Concurrency/synchronizeTask";
import KlineDB from "@/utils/IndexedDB/klineDatabase";
import IndexedDBService from "@/utils/IndexedDB";

import { useChartLine } from "@/store/modules/chartLine";
import { useChartSub } from "@/store/modules/chartSub";
import { useSymbols } from "@/store/modules/symbols";
import { useTime } from "@/store/modules/time";

const chartLineStore = useChartLine();
const chartSubStore = useChartSub();
const symbolsStore = useSymbols();

type Tunit = "day" | "week" | "month" | "hour" | "minute";
type TLineParams = ReqLineInfo & {
  resolution: string;
  from: number;
  to: number;
  firstDataRequest?: Boolean;
};

// k线起始时间diff
const timeDiff: Record<string, Tunit> = {
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

// 图表配置
const chartConfig = {
  supports_search: true,
  supports_group_request: false,
  supports_marks: true,
  supports_timescale_marks: false,
  supports_time: true,
  exchanges: [],
  symbols_types: [],
  supported_resolutions: Object.keys(RESOLUTES),
};

const formatTime = (time: number) => {
  const hours = Math.floor(time / 60);
  const second = time % 60;
  return `${hours < 9 ? "0" : ""}${hours}${second < 9 ? "0" : ""}${second}`;
};

// 计算理想状态（无休市）所需的k线条数
function calcCount(params: types.PeriodParams & { resolution: string }) {
  const to = dayjs.unix(params.to);
  const from = dayjs.unix(params.from);
  const diffType = timeDiff[params.resolution];
  return to.diff(from, diffType);
}

// 商品切换还未初始化，但是数据已经先到达，存储最新的那个bar
let temBar: Record<string, ResLineInfo> = {};

/**
 * 获取k线历史数据
 * @param taskMap 并发任务调度器 品种和周期作为key
 */
const taskMap: Record<string, SynchronizeTask<any>> = {};
const serviceMap: Record<string, IndexedDBService> = {};
interface ICacheDataItem {
  id: number;
  resolution: string;
  data: ResLineInfo;
}
interface IMissingItem {
  limit_ctm: number;
  count: number;
}
interface ICacheSearch {
  missingList: IMissingItem[];
  searchData: ICacheDataItem[];
}

// 获取缓存
async function getCacheData(params: TLineParams): Promise<ICacheSearch> {
  const { symbol, resolution, from, to } = params;
  const countSum = calcCount({ from, to, resolution });
  const initSize: IMissingItem = {
    limit_ctm: to,
    count: countSum,
  };
  try {
    // 创建各个品种的db
    if (!serviceMap[symbol]) {
      serviceMap[symbol] = await new KlineDB(symbol).initKlineDB();
    }
    const allSearchData: ICacheDataItem[] =
      (await serviceMap[symbol].findByCondition({
        resolution,
      })) || [];

    const searchData = orderBy(
      allSearchData.filter((e) => e.data.ctm >= from && e.data.ctm <= to),
      (item) => item.data.ctm
    );

    if (!searchData.length) {
      return {
        missingList: [initSize],
        searchData,
      };
    }

    // 缺失的范围
    const missingList: IMissingItem[] = [];
    const idList = searchData.map((item) => item.data.ctm);
    const minCtm = Math.min(...idList);
    const maxCtm = Math.max(...idList);

    // 认为缺失的数据
    // [ 以前, 缓存, 将来 ]
    // 以前
    if (from < minCtm) {
      const count = calcCount({ from: from, to: minCtm, resolution });
      if (count > 0) {
        missingList.push({
          limit_ctm: minCtm,
          count,
        });
      }
    }
    // 将来
    if (to > maxCtm) {
      const count = calcCount({ from: maxCtm, to: to, resolution });
      if (count > 0) {
        missingList.push({
          limit_ctm: to,
          count,
        });
      }

      // 未来差的太多
      if (count > 500) {
        return {
          missingList: [initSize],
          searchData: [],
        };
      }
    }

    return {
      missingList,
      searchData,
    };
  } catch {
    return {
      missingList: [initSize],
      searchData: [],
    };
  }
}
async function saveCacheData(params: TLineParams & { data: ResLineInfo[] }) {
  try {
    const { symbol, data, resolution } = params;
    const list = data.map((item) => {
      return {
        id: `${item.ctm}_${resolution}`,
        resolution,
        data: item,
      };
    });
    // 删除最新一根
    const orderList = orderBy(list, (item) => item.data.ctm);
    if (params.firstDataRequest) {
      orderList.pop();
    }
    if (orderList.length > 0) {
      await serviceMap[symbol].addMultipleData(orderList);
    }
  } catch {}
}

async function getLineHistory(chartId: string, params: TLineParams) {
  try {
    const { resolution, ...updata } = params;
    // 拿缓存数据
    const cache = await getCacheData(params);
    const hisList = cache.missingList.map((item) => {
      return klineHistory({
        limit_ctm: item.limit_ctm,
        count: item.count,
        period_type: updata.period_type,
        symbol: updata.symbol,
      });
    });
    const httpHisList = await Promise.allSettled(hisList);
    const dataList = cache.searchData.map((item) => item.data);
    const needCacheData = [];
    for (let i = 0; i < httpHisList.length; i++) {
      const item = httpHisList[i];
      if (item.status === "fulfilled") {
        const data = item.value.data;
        dataList.push(...data);
        needCacheData.push(...data);
      }
    }
    // 缓存数据
    if (needCacheData.length) {
      await saveCacheData({ ...params, data: needCacheData });
    }
    if (dataList.length === 0) {
      return Promise.resolve([]);
    }
    const sortData = orderBy(dataList, "ctm");
    const bars = sortData.map((item) => {
      // 日/周/月 线数据+8小时
      const time = checkDMW(resolution)
        ? (item.ctm + 8 * 3600) * 1000
        : item.ctm * 1000;
      return {
        ...item,
        time,
      };
    });
    // 暂存最新一根的k线数据
    const bar = maxBy(bars, "ctm");
    if (bar && updata.firstDataRequest) {
      temBar[chartId] = cloneDeep(bar);
    }
    return Promise.resolve(bars);
  } catch (error) {
    return Promise.reject([]);
  }
}

export const datafeed = (id: string) => {
  let UID = "";
  return {
    onReady: (callback: Function) => {
      setTimeout(() => {
        callback(chartConfig);
      });
    },

    //商品配置
    resolveSymbol: (
      symbolName: string,
      onSymbolResolvedCallback: Function,
      onResolveErrorCallback: Function
    ) => {
      UID = "";
      // 获取session
      const storeSymbolInfo = symbolsStore.symbols.find(
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
            const preSession = `${formatTime(pre.btime)}-${formatTime(
              pre.etime
            )}`;
            const endSession = `${formatTime(next.btime)}-${formatTime(
              next.etime
            )}`;
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
          `${formatTime(fTime.btime)}-${formatTime(fTime.etime)}:${
            Number(weekDay) + 1
          }`;
        timeArr.push(resultTs);
      }
      const session = timeArr.join("|");
      const timeStore = useTime();

      const symbol_stub = {
        name: symbolName,
        description: storeSymbolInfo?.description || "-",
        visible_plots_set: "ohlcv",
        minmov: 1, // 纵坐标比例
        minmov2: 0,
        pricescale: Math.pow(10, storeSymbolInfo?.digits || 2), // 纵坐标小数位数
        session,
        // session: "24x7",
        // has_empty_bars: true,
        ticker: symbolName,
        timezone: timeStore.settedTimezone,
        // type: "cfd",
        has_intraday: true, // 是否支持分钟数据
        has_daily: true, // 是否支持日数据
        has_weekly_and_monthly: true, // 是否支持月，周数据
        intraday_multipliers: ["1", "5", "15", "30", "60", "240"], // 支持的分钟级周期
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
        // periodParams.countBack 长度不够导致数据缺失
        const count = calcCount({ ...periodParams, resolution });
        const updata = {
          resolution,
          period_type: types.Periods[resolution] || resolution,
          symbol: symbolInfo.name,
          count,
          limit_ctm: periodParams.to,
        };
        const taskKey = `${symbolInfo.name}`;
        if (!taskMap.hasOwnProperty(taskKey)) {
          taskMap[taskKey] = new SynchronizeTask(1);
        }
        taskMap[taskKey]
          .add(() =>
            getLineHistory(id, {
              ...updata,
              ...periodParams,
            })
          )
          .then((data) => {
            setTimeout(() => {
              onHistoryCallback(data, {
                noData: data.length === 0,
              });
            });
          })
          .catch(() => {
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
      UID = `${id}@${subscriberUID}`;

      const endBar = temBar[id];

      const newBar = chartLineStore.newbar[UID];

      // 初始化最新一根的数据同步到store
      if (endBar) {
        if (!newBar || (newBar && endBar.time >= newBar.time)) {
          chartLineStore.newbar[UID] = cloneDeep(endBar);
        }
      }
      delete temBar[id];

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

    //取消订阅
    unsubscribeBars: (subscriberUID: string) => {
      const oldUID = `${id}@${subscriberUID}`;
      chartLineStore.unsubscribed(oldUID);
    },

    // 查找商品（商品）
    searchSymbols: (
      userInput: string,
      exchange: string,
      symbolType: string,
      onResultReadyCallback: Function
    ) => {
      // 模糊匹配
      const regex = new RegExp(userInput.split("").join(".*"), "i");
      const matches = symbolsStore.symbols.map((item, index) => {
        const exchangeMatch = regex.test(item.path);
        const symbolMatch = regex.test(item.symbol);
        return {
          index,
          count: (exchangeMatch ? 1 : 0) + (symbolMatch ? 1 : 0),
        };
      });

      // 匹配度排列
      matches.sort((a, b) => b.count - a.count);
      const sortedIndices = matches.map((match) => match.index);
      const sortedArr = sortedIndices.map(
        (index) => symbolsStore.symbols[index]
      );

      const targetList = sortedArr.map((item: types.ISessionSymbolInfo) => {
        return {
          symbol: item.symbol,
          full_name: item.symbol,
          description: item.description,
          exchange: item.path,
          ticker: item.symbol,
          force_session_rebuild: true,
        };
      });
      onResultReadyCallback(targetList);
    },
  };
};
