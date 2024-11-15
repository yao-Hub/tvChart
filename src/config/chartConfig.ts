import { flattenDeep, groupBy, orderBy, get, last, cloneDeep } from "lodash";
import moment from "moment";
import { klineHistory } from "api/kline/index";
import * as types from "@/types/chart/index";
import { round } from "utils/common/index";
import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import { useOrder } from "@/store/modules/order";
import { useSocket } from "@/store/modules/socket";
import { RESOLUTES } from "@/constants/common";

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();
const orderStore = useOrder();
const socketStore = useSocket();

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

const subscribed: any = {};

let new_one: Record<string, types.LineData> = {};

const barsCache: any = {};

function hasEmptyArrayValue(map: Map<string, any>) {
  for (const [key, value] of map) {
    if (Array.isArray(value) && value.length === 0) {
      return key;
    }
  }
  return false;
}

// 优化当前k线图加载
const infoCache: any = {};
function getCacheBars(data: any, id: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const fkey = `${data.symbol}#${data["period_type"]}`;
      const skey = `${data["limit_ctm"]}`;
      const cache = barsCache[fkey];
      if ([undefined, null].includes(cache)) {
        barsCache[fkey] = new Map();
        const res = await klineHistory(data);
        barsCache[fkey].set(skey, res.data);
        resolve(res.data);
        return;
      }
      const ifBars = barsCache[fkey].has(skey);
      if (ifBars) {
        const bar = barsCache[fkey].get(skey);
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
        infoCache[id].nowResolution = data.period_type;
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
  let kLineLoading = false;
  // 报价和k线图的socket监听
  function socketOpera() {
    // 监听报价
    socketStore.socket.on("quote", function (d: any) {
      if (kLineLoading) {
        return;
      }
      const symbolInfo = chartSubStore.symbols.find(
        (e) => e.symbol === d.symbol
      );
      if (symbolInfo) {
        const digits = symbolInfo.digits;
        d.ask = round(d.ask, digits);
        d.bid = round(d.bid, digits);
      }
      const oldQuote = orderStore.currentQuotes[d.symbol];
      const open = oldQuote?.open || d?.open;
      const result = {
        ...d,
      };
      if (open) {
        result.open = open;
      }
      orderStore.currentQuotes[d.symbol] = result;
      if (
        !subscribed[`${id}@${d.symbol}`] ||
        !subscribed[`${id}@${d.symbol}`].symbolInfo ||
        !new_one[d.symbol]
      ) {
        //图表没初始化
        return;
      }
      if (chartInitStore.chartLoading[id]) {
        return;
      }
      //报价更新 最新一条柱子 实时 上下 跳动
      //报价为图表当前品种的报价
      const currentSymbol = subscribed[`${id}@${d.symbol}`].symbolInfo?.name;
      if (currentSymbol && d.symbol === currentSymbol) {
        //报价为图表当前品种的报价
        if (new_one[d.symbol].high < d.bid) {
          new_one[d.symbol].high = d.bid;
        }
        if (new_one[d.symbol].low > d.bid) {
          new_one[d.symbol].low = d.bid;
        }
        const newlastbar = {
          time: new_one[d.symbol].time * 1000,
          close: d.bid,
          high: new_one[d.symbol].high,
          low: new_one[d.symbol].low,
          open: new_one[d.symbol].open,
          volume: new_one[d.symbol].volume + 1,
        };
        new_one[d.symbol].volume = newlastbar.volume;
        subscribed[`${id}@${d.symbol}`].onRealtimeCallback(newlastbar); //更新K线
      }
    });
    // 监听k线
    socketStore.socket.on("kline_new", function (d: any) {
      // 提升k线数据
      const lastLines = last(orderBy(d.klines, "ctm", "desc"));
      orderStore.currentKline[d.symbol] = lastLines;

      // 图表没初始化
      if (
        !subscribed[`${id}@${d.symbol}`] ||
        !subscribed[`${id}@${d.symbol}`].symbolInfo ||
        !new_one[d.symbol]
      ) {
        return;
      }
      if (chartInitStore.chartLoading[id]) {
        return;
      }
      const currentSymbol = subscribed[`${id}@${d.symbol}`].symbolInfo?.name;

      const condition =
        currentSymbol &&
        d.symbol === currentSymbol &&
        subscribed[`${id}@${d.symbol}`].resolution == d.period_type;
      //{"server":"upway-live","symbol":"BTCUSD","period_type":1,"klines":[{"ctm":1715408460,"date_time":"2024-05-11 14:21:00","open":60955.5,"high":60955.5,"low":60955.5,"close":60955.5,"volume":1}]}
      if (condition) {
        kLineLoading = true;
        d.klines = orderBy(d.klines, ["ctm"]);
        for (let i in d.klines) {
          let newlastbar = {
            time: d.klines[i].ctm,
            close: d.klines[i].close,
            high: d.klines[i].high,
            low: d.klines[i].low,
            open: d.klines[i].open,
            volume: d.klines[i].volume,
          };
          new_one[d.symbol] = cloneDeep(newlastbar);
          newlastbar.time = newlastbar.time * 1000;
          subscribed[`${id}@${d.symbol}`].onRealtimeCallback(newlastbar); //更新K线
        }
        kLineLoading = false;
      }
    });
  }

  return {
    onReady: (callback: Function) => {
      infoCache[id] = {};
      setTimeout(() => {
        callback(config);
        socketOpera();
      });
    },

    //商品配置
    resolveSymbol: (
      symbolName: string,
      onSymbolResolvedCallback: Function,
      onResolveErrorCallback: Function
    ) => {
      if (!subscribed[`${id}@${symbolName}`]) {
        subscribed[`${id}@${symbolName}`] = {};
      }
      orderStore.currentSymbol = symbolName;
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
        description: "",
        visible_plots_set: false,
        minmov: 1,
        minmov2: 0,
        pricescale: 100,
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
      setTimeout(function () {
        onSymbolResolvedCallback(symbol_stub);
      });
    },

    //渲染历史数据
    getBars: (
      symbolInfo: types.TVSymbolInfo,
      resolution: string,
      periodParams: types.PeriodParams,
      onHistoryCallback: Function,
      onErrorCallback: Function
    ) => {
      const symbol = symbolInfo.name;
      infoCache[id].temResolution = resolution;
      infoCache[id].temSymbol = symbol;
      subscribed[`${id}@${symbol}`].onHistoryCallback = onHistoryCallback;
      subscribed[`${id}@${symbol}`].onErrorCallback = onErrorCallback;
      const bar: types.LineData[] = [];
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
          types.Periods[resolution as keyof typeof types.Periods] || resolution,
        symbol: symbolInfo.name,
        count: count,
        limit_ctm: periodParams.to,
      };
      getCacheBars(updata, id)
        .then((res: any) => {
          if (res.length === 0) {
            subscribed[`${id}@${symbol}`].onHistoryCallback([]);
            return;
          }
          const preSymbol = get(subscribed, `${id}@${symbol}.symbolInfo.name`);
          const reverse_data = orderBy(res, "ctm");
          const data_cache = reverse_data.map((item) => {
            const { ctm, open, high, low, close, volume } = item;
            const tone = { time: ctm, open, high, low, close, volume };
            if (
              !new_one ||
              !new_one[symbol] ||
              ctm > new_one[symbol].time ||
              (symbolInfo.name !== preSymbol && preSymbol)
            ) {
              new_one[symbol] = cloneDeep(tone);
            }
            return tone;
          });
          // 生成k线数据
          data_cache.forEach((item) => {
            const barValue = {
              ...item,
              // 时间戳
              time: item.time * 1000,
            };
            bar.push(barValue);
          });
          setTimeout(() => {
            subscribed[`${id}@${symbol}`].onHistoryCallback(bar);
          });
        })
        .catch(() => {
          subscribed[`${id}@${symbol}`].onErrorCallback(bar);
        });
    },

    //实时更新
    subscribeBars: (
      symbolInfo: types.TVSymbolInfo,
      resolution: string,
      onRealtimeCallback: Function,
      subscriberUID: string,
      onResetCacheNeededCallback: Function
    ) => {
      const symbol = symbolInfo.name;
      subscribed[`${id}@${symbol}`] = {
        symbolInfo,
        resolution,
        onRealtimeCallback,
        onResetCacheNeededCallback,
      };
      chartSubStore.subKlineQuote({
        subscriberUID,
        symbolInfo,
        resolution,
      });
    },

    //取消订阅,撤销掉某条线的实时更新
    unsubscribeBars: (subscriberUID: string) => {
      // chartSubStore.unsubKlineQuote(subscriberUID);
    },

    // 查找品种（商品）
    searchSymbols: (
      userInput: string,
      exchange: string,
      symbolType: string,
      onResultReadyCallback: Function
    ) => {
      // 模糊匹配
      const regex = new RegExp(userInput.split("").join(".*"), "i");
      const matches = chartSubStore.symbols.map((item, index) => {
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
        (index) => chartSubStore.symbols[index]
      );

      const targetList = sortedArr.map((item: types.SessionSymbolInfo) => {
        return {
          symbol: item.symbol,
          full_name: item.symbol,
          description: item.path,
          exchange: item.path,
          ticker: item.symbol,
          force_session_rebuild: true,
        };
      });
      onResultReadyCallback(targetList);
    },
  };
};
