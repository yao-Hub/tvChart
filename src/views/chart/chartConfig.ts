import { flattenDeep, groupBy, orderBy, get, cloneDeep } from 'lodash';
import moment from 'moment';
import { socket } from '@/utils/socket/operation';
import { klineHistory } from 'api/kline/index';
import * as types from '@/types/chart/index';
import { useChartSub } from '@/store/modules/chartSub';
import { useOrder } from '@/store/modules/order';
import { RESOLUTES } from '@/constants/common';

const chartSubStore = useChartSub();
const orderStore = useOrder();

const countOptions: any = {
  '1D': 'days',
  '1W': 'weeks',
  '1M': 'months',
  '60': 'hours',
  '240': ['hours', 4],
  "1": 'minutes',
  "5": ['minutes', 5],
  "15": ['minutes', 15],
  "30": ['minutes', 30],
};

const config = {
  "supports_search": true,
  "supports_group_request": false,
  "supports_marks": false,
  "supports_timescale_marks": false,
  "supports_time": true,
  "exchanges": [],
  "symbols_types": [],
  "supported_resolutions": Object.keys(RESOLUTES),
};

const formatToSeesion = (time: number) => {
  const hours = Math.floor(time / 60);
  const second = time % 60;
  return `${hours < 9 ? '0' : ''}${hours}${second < 9 ? '0' : ''}${second}`;
};

const subscribed: any = {};

let new_one: types.LineData;

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
      const fkey = `${id}${data.symbol}#${data['period_type']}`;
      const skey = `${data['limit_ctm']}#${data['period_type']}`;
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
        const { nowSymbol, temSymbol, temResolution, nowResolution } = infoCache[id];
        if (!nowSymbol || (temSymbol === nowSymbol && temResolution === nowResolution)) {
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
};

export const datafeed = (id: string) => {
  return {
    onReady: (callback: Function) => {
      subscribed[id] = {};
      infoCache[id] = {};
      setTimeout(() => {
        callback(config);
        socketOpera();
      }, 0);
    },

    //商品配置
    resolveSymbol: (symbolName: string, onSymbolResolvedCallback: Function, onResolveErrorCallback: Function) => {
      // 获取session
      const symbolInfo = chartSubStore.symbols.find(e => e.symbol === symbolName);
      const ttimes = symbolInfo ? symbolInfo.ttimes : [];
      // 当时间为0 到 0时为关闭日
      const times = flattenDeep(Object.values(ttimes)).filter((obj) => symbolName === obj.symbol && obj.btime !== obj.etime);
      const grouptObj = groupBy(times, 'week_day');
      const timeArr = [];
      for (const weekDay in grouptObj) {
        const tItem = grouptObj[weekDay];
        const fTime = tItem.reduce((pre: types.TimeUnit, next: types.TimeUnit) => {
          const preSession = `${formatToSeesion(pre.btime)}-${formatToSeesion(pre.etime)}`;
          const endSession = `${formatToSeesion(next.btime)}-${formatToSeesion(next.etime)}`;
          return {
            btime: pre.btime,
            etime: next.etime,
            symbol: symbolName,
            week_day: Number(weekDay),
            session: `${preSession},${endSession}:${Number(weekDay) + 1}`
          };
        });
        const resultTs = fTime.session || `${formatToSeesion(fTime.btime)}-${formatToSeesion(fTime.etime)}:${Number(weekDay) + 1}`;
        timeArr.push(resultTs);
      }
      const session = timeArr.join('|');
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
        supported_resolutions: ["D", "W", "M", "60", "240", "1", "5", "15", "30"],
        exchange: symbolInfo?.path
      };

      setTimeout(function () {
        onSymbolResolvedCallback(symbol_stub);
      });
    },

    //渲染历史数据
    getBars: (symbolInfo: types.TVSymbolInfo, resolution: string, periodParams: types.PeriodParams, onHistoryCallback: Function, onErrorCallback: Function) => {
      infoCache[id].temResolution = resolution;
      infoCache[id].temSymbol = symbolInfo.name;
      const bar: types.LineData[] = [];
      let count = periodParams.countBack;
      // 第一次请求会出现数据请求长度不够导致数据缺失
      if (periodParams.firstDataRequest) {
        const to = moment.unix(periodParams.to);
        const from = moment.unix(periodParams.from);
        const option = countOptions[resolution];
        let diffType;
        let gap = 1;
        if (typeof option === 'string') {
          diffType = option;
        } else {
          diffType = option[0];
          gap = option[1];
        }
        count = Math.ceil(to.diff(from, diffType) / gap);
      }
      const updata = {
        "period_type": types.Periods[resolution as keyof typeof types.Periods] || resolution,
        "symbol": symbolInfo.name,
        "count": count,
        "limit_ctm": periodParams.to
      };
      getCacheBars(updata, id).then((res: any) => {
        if (res.length === 0) {
          onHistoryCallback([]);
          return;
        }
        const preSymbol = get(subscribed, `${id}.symbolInfo.name`) || '';
        const reverse_data = orderBy(res, 'ctm');
        const data_cache = reverse_data.map(item => {
          const { ctm, open, high, low, close, volume } = item;
          const tone = { time: ctm, open, high, low, close, volume };
          if (!new_one || ctm > new_one.time || (symbolInfo.name !== preSymbol && preSymbol)) {
            new_one = JSON.parse(JSON.stringify(tone));
          }
          return tone;
        });
        // 生成k线数据
        data_cache.forEach(item => {
          const barValue = {
            ...item,
            // 时间戳
            time: item.time * 1000,
          };
          bar.push(barValue);
        });
        setTimeout(() => {
          onHistoryCallback(bar);
        });
      }).catch(() => {
        onErrorCallback(bar);
      });
    },

    //实时更新
    subscribeBars: (symbolInfo: types.TVSymbolInfo, resolution: string, onRealtimeCallback: Function, subscriberUID: string, onResetCacheNeededCallback: Function) => {
      orderStore.currentSymbol = symbolInfo.name;

      subscribed[id].symbolInfo = symbolInfo;
      subscribed[id].resolution = resolution;
      subscribed[id].onRealtimeCallback = onRealtimeCallback;
      subscribed[id].onResetCacheNeededCallback = onResetCacheNeededCallback;
      chartSubStore.subscribeKline({
        subscriberUID,
        symbolInfo,
        resolution
      });
    },

    //取消订阅,撤销掉某条线的实时更新
    unsubscribeBars: (subscriberUID: string) => {
      // chartSubStore.unsubscribeKline(subscriberUID);
    },

    // 查找品种（商品）
    searchSymbols: (userInput: string, exchange: string, symbolType: string, onResultReadyCallback: Function) => {
      // 模糊匹配
      const regex = new RegExp(userInput.split('').join('.*'), 'i');;
      const matches = chartSubStore.symbols.map((item, index) => {
        const exchangeMatch = regex.test(item.path);
        const symbolMatch = regex.test(item.symbol);
        return { index, count: (exchangeMatch ? 1 : 0) + (symbolMatch ? 1 : 0) };
      });

      // 匹配度排列
      matches.sort((a, b) => b.count - a.count);

      const sortedIndices = matches.map(match => match.index);
      const sortedArr = sortedIndices.map(index => chartSubStore.symbols[index]);

      const targetList = sortedArr.map((item: types.SessionSymbolInfo) => {
        return {
          symbol: item.symbol,
          full_name: item.symbol,
          description: item.path,
          exchange: item.path,
          ticker: item.symbol,
          force_session_rebuild: true
        };
      });
      onResultReadyCallback(targetList);
    }
  };
};

// 报价和k线图的socket监听
function socketOpera() {
  // 监听报价
  socket.on('quote', function (d) {
    // 提升订单报价
    orderStore.currentQuotes[d.symbol] = d;

    for (const id in subscribed) {
      if (!subscribed[id].symbolInfo) { //图表没初始化
        return;
      }
      //报价更新 最新一条柱子 实时 上下 跳动
      if (d.symbol === subscribed[id].symbolInfo.name) { //报价为图表当前品种的报价
        if (new_one.high < d.bid) {
          new_one.high = d.bid;
        }
        if (new_one.low > d.bid) {
          new_one.low = d.bid;
        }
        const newlastbar = {
          time: new_one.time * 1000,
          close: d.bid,
          high: new_one.high,
          low: new_one.low,
          open: new_one.open,
          volume: new_one.volume + 1
        };
        subscribed[id].onRealtimeCallback(newlastbar); //更新K线
      }
    }
  });
  // 监听k线
  socket.on('kline_new', function (d) {
    // 提升k线数据
    const klines = cloneDeep(d.klines);
    orderStore.currentKline = { ...klines.reverse().pop(), symbol: d.symbol };

    for (const id in subscribed) {
      if (!subscribed[id].symbolInfo) { // 图表没初始化
        return;
      }
      //{"server":"upway-live","symbol":"BTCUSD","period_type":1,"klines":[{"ctm":1715408460,"date_time":"2024-05-11 14:21:00","open":60955.5,"high":60955.5,"low":60955.5,"close":60955.5,"volume":1},{"ctm":1715408400,"date_time":"2024-05-11 14:20:00","open":60940,"high":60956,"low":60940,"close":60956,"volume":6}]}
      if (d.symbol == subscribed[id].symbolInfo.name && subscribed[id].resolution == d.period_type) {
        d.klines = d.klines.reverse();
        for (let i in d.klines) {
          let newlastbar = {
            time: d.klines[i].ctm,
            close: d.klines[i].close,
            high: d.klines[i].high,
            low: d.klines[i].low,
            open: d.klines[i].open,
            volume: d.klines[i].volume
          };
          if (newlastbar.time > new_one.time) {
            new_one = JSON.parse(JSON.stringify(newlastbar));
          }
          newlastbar.time = newlastbar.time * 1000;
          subscribed[id].onRealtimeCallback(newlastbar); //更新K线
        }
      }
    }
  });
}
