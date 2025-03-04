import i18n from "@/language/index";
import dayjs from "dayjs";
import Decimal from "decimal.js";
import { ElMessageBox } from "element-plus";
import { defineStore } from "pinia";
import { reactive, watch } from "vue";
import { useRouter } from "vue-router";

import { useChartAction } from "./chartAction";
import { useDialog } from "./dialog";
import { useQuotes } from "./quotes";
import { useRate } from "./rate";
import { useSocket } from "./socket";
import { useStorage } from "./storage";
import { useSymbols } from "./symbols";
import { useUser } from "./user";

import * as types from "#/chart/index";
import * as orderTypes from "#/order";
import * as orders from "api/order/index";

import { debounce, get, isNil } from "lodash";
import { round } from "utils/common/index";
import { getTradingDirection } from "utils/order/index";

type ModeType = "create" | "confirm";
type SymbolType = string;
type VolumeType = string;
type OrderStateWithDirectionRequired<T extends ModeType> = T extends "confirm"
  ? {
      symbol: SymbolType;
      volume: VolumeType;
      directionType: orderTypes.DirectionType;
      mode: T;
    }
  : {
      symbol: SymbolType;
      volume?: VolumeType;
      directionType?: orderTypes.DirectionType;
      mode?: T;
    };

interface IState {
  initOrderState: OrderStateWithDirectionRequired<ModeType>;
  currentKline: Record<string, types.ILine>;
  orderData: orderTypes.TableData;
  dataLoading: Record<orderTypes.TableTabKey, boolean>;
  dataEnding: Record<orderTypes.TableTabKey, boolean>;
  dataFilter: Record<orderTypes.TableTabKey, any>;
  ifOne: boolean | null;
  ifQuick: boolean;
}

export const useOrder = defineStore("order", () => {
  const dateFormat = "YYYY-MM-DD HH:mm:ss";
  const monday = dayjs().startOf("week").startOf("day").format(dateFormat);
  const today = dayjs().endOf("day").format(dateFormat);
  const state = reactive<IState>({
    initOrderState: { symbol: "" },
    currentKline: {},
    orderData: {
      marketOrder: [],
      pendingOrder: [],
      pendingOrderHistory: [],
      marketOrderHistory: [],
      blanceRecord: [],
      log: [],
    },
    dataLoading: {
      marketOrder: false,
      pendingOrder: false,
      pendingOrderHistory: false,
      marketOrderHistory: false,
      blanceRecord: false,
      log: false,
    },
    dataEnding: {
      marketOrder: false,
      pendingOrder: false,
      pendingOrderHistory: false,
      marketOrderHistory: false,
      blanceRecord: false,
      log: false,
    },
    dataFilter: {
      marketOrder: {
        symbol: [],
        direction: null,
        pol: null,
      },
      pendingOrder: {
        symbol: [],
      },
      pendingOrderHistory: {
        symbol: [],
        createTime: [],
        addTime: [],
        closeTime: [],
      },
      marketOrderHistory: {
        symbol: [],
        createTime: [],
        addTime: [],
        closeTime: [monday, today],
      },
      blanceRecord: {
        createTime: [],
        pol: null,
      },
      log: {
        date: "",
        source: "",
        type: "",
      },
    },
    ifOne: null, // 一键交易
    ifQuick: true, // 快捷交易(图表是否显示快捷交易组件)
  });

  // 市价单盈亏
  const quotesStore = useQuotes();
  watch(
    () => quotesStore.qoutes,
    (qoutes) => {
      state.orderData.marketOrder.forEach((item) => {
        const { volume, symbol, open_price, type, fee, storage } = item;
        const quote = qoutes[symbol];
        const closePrice = type ? get(quote, "ask") : get(quote, "bid");
        if (!isNil(closePrice)) {
          const direction = getTradingDirection(type);
          const params = {
            symbol,
            closePrice: +closePrice,
            buildPrice: +open_price,
            volume: volume / 100,
            fee,
            storage,
          };
          const result = getProfit(params, direction);
          item.profit = result;
        }
      });
    },
    { deep: true, immediate: true }
  );

  const createOrder = <T extends ModeType>(
    params?: OrderStateWithDirectionRequired<T>
  ) => {
    const dialogStore = useDialog();
    const userStore = useUser();
    const t = i18n.global.t;
    if (!userStore.account.token) {
      ElMessageBox.confirm("", t("account.notLoggedIn"), {
        confirmButtonText: t("account.logIn"),
        cancelButtonText: t("cancel"),
        type: "warning",
      }).then(() => {
        const router = useRouter();
        const chartActionStore = useChartAction();
        chartActionStore.setCacheAction("createOrder");
        router.replace({ name: "login" });
      });
      return;
    }
    if (userStore.state.loginInfo?.trade_rights !== 1) {
      ElMessageBox.alert(
        t("account.prohibitTrading"),
        t("account.noAuthority"),
        {
          confirmButtonText: t("ok"),
          type: "error",
        }
      );
      return;
    }
    if (params) {
      state.initOrderState = { ...params };
    }
    dialogStore.openDialog("orderDialogVisible");
  };

  // 设置一键交易状态
  const setOneTrans = (result: boolean) => {
    const storageStore = useStorage();
    state.ifOne = result;
    storageStore.setItem("ifOne", result);
  };

  // 获取一键交易状态
  const getOneTrans = () => {
    const storageStore = useStorage();
    const ifOne = storageStore.getItem("ifOne");
    state.ifOne = isNil(ifOne) ? null : ifOne;
    return state.ifOne;
  };

  // 获取快捷交易状态
  const getQuickTrans = () => {
    const storageStore = useStorage();
    const sto = storageStore.getItem("ifQuick");
    state.ifQuick = isNil(sto) ? true : sto;
    return state.ifQuick;
  };

  const getData = debounce((type: string) => {
    const userStore = useUser();
    switch (type) {
      // 单个平仓
      case "single_marketOrder_close":
        Promise.all([
          getMarketOrderHistory(),
          getBlanceRecord(),
          userStore.getLoginInfo(),
        ]);
        break;
      // 监听订单已建仓
      case "order_opened":
        Promise.all([getMarketOrders(), userStore.getLoginInfo()]);
        break;
      // 监听订单已平仓
      case "order_closed":
        Promise.all([
          getMarketOrders(),
          getMarketOrderHistory(),
          getBlanceRecord(),
          userStore.getLoginInfo(),
        ]);
        break;
      // 监听订单已修改（止盈止损）
      case "order_modified":
        getMarketOrders();
        break;
      // 监听挂单已创建
      // 监听挂单已更新;
      // 监听 stop limit 挂单 已触及 stop
      case "pending_order_opened":
      case "pending_order_modified":
      case "pending_order_valided":
        getPendingOrders();
        break;
      // 监听挂单已删除
      case "pending_order_deleted":
        Promise.all([getPendingOrders(), getPendingOrderHistory()]);
        break;
      // 监听挂单已成交
      case "pending_order_dealt":
        Promise.all([
          getMarketOrders(),
          getPendingOrders(),
          userStore.getLoginInfo(),
        ]);
        break;
      // 监听出入金
      case "balance_order_added":
        Promise.all([getBlanceRecord(), userStore.getLoginInfo()]);
        break;
      case "marketOrder":
        getMarketOrders();
        break;
      case "pendingOrder":
        getPendingOrders();
        break;
      case "marketOrderHistory":
        getMarketOrderHistory();
        break;
      case "pendingOrderHistory":
        getPendingOrderHistory();
        break;
      case "blanceRecord":
        getBlanceRecord();
        break;
      case "log":
        getLog();
        break;
      default:
        break;
    }
  }, 200);
  const initTableData = async () => {
    const socketStore = useSocket();
    await Promise.all([
      getMarketOrders(),
      // getPendingOrders(),
      // getMarketOrderHistory(),
      // getPendingOrderHistory(),
      // getBlanceRecord(),
    ]);

    socketStore.orderChanges((type: string) => {
      getData(type);
    });
  };

  // 查询持仓
  const getMarketOrders = debounce(async () => {
    try {
      state.dataLoading.marketOrder = true;
      const res = await orders.openningOrders();
      res.data = (res.data || []).map((item, index) => {
        return {
          ...item,
          key: index,
        };
      });
      state.orderData.marketOrder = res.data;
    } finally {
      state.dataLoading.marketOrder = false;
    }
  }, 200);

  // 查询挂单（有效）
  const getPendingOrders = debounce(async () => {
    try {
      state.dataLoading.pendingOrder = true;
      const res = await orders.pendingOrders();
      res.data = (res.data || []).map((item, index) => {
        return {
          ...item,
          key: index,
        };
      });
      state.orderData.pendingOrder = res.data;
    } finally {
      state.dataLoading.pendingOrder = false;
    }
  }, 200);

  // 查询挂单历史（失效）
  const getPendingOrderHistory = debounce(async (limit_id?: number) => {
    try {
      state.dataLoading.pendingOrderHistory = true;
      const [begin_time, end_time] =
        state.dataFilter.pendingOrderHistory.createTime;
      const updata: orders.reqHistoryPendingOrders = {
        count: 200,
        limit_id,
      };
      updata.begin_time = begin_time;
      updata.end_time = end_time;
      const res = await orders.invalidPendingOrders(updata);
      res.data = (res.data || []).map((item, index) => {
        return {
          ...item,
          key: index,
        };
      });
      if (limit_id) {
        state.orderData.pendingOrderHistory.push(...res.data);
      } else {
        state.orderData.pendingOrderHistory = res.data;
      }
      state.dataEnding.pendingOrderHistory = !res.data.length;
    } finally {
      state.dataLoading.pendingOrderHistory = false;
    }
  }, 200);

  // 查询交易历史
  const getMarketOrderHistory = debounce(async (limit_id?: number) => {
    try {
      state.dataLoading.marketOrderHistory = true;
      const { addTime, closeTime } = state.dataFilter.marketOrderHistory;
      const [open_begin_time, open_end_time] = addTime;
      const [close_begin_time, close_end_time] = closeTime;
      const updata: orders.reqHistoryOrders = {
        count: 200,
        limit_id,
      };
      updata.open_begin_time = open_begin_time;
      updata.open_end_time = open_end_time;
      updata.close_begin_time = close_begin_time;
      updata.close_end_time = close_end_time;
      const res = await orders.historyOrders(updata || {});
      res.data = (res.data || []).map((item, index) => {
        return {
          ...item,
          key: index,
        };
      });
      if (limit_id) {
        state.orderData.marketOrderHistory.push(...res.data);
      } else {
        state.orderData.marketOrderHistory = res.data;
      }
      state.dataEnding.marketOrderHistory = !res.data.length;
    } finally {
      state.dataLoading.marketOrderHistory = false;
    }
  }, 200);

  // 查询出入金记录
  const getBlanceRecord = debounce(async (limit_id?: number) => {
    try {
      state.dataLoading.blanceRecord = true;
      const { createTime } = state.dataFilter.blanceRecord;
      const [setup_begin_time, setup_end_time] = createTime;
      const updata: orders.reqHistoryOrders = {
        types: [18],
        setup_begin_time,
        setup_end_time,
        count: 200,
        limit_id,
      };
      const res = await orders.historyOrders(updata);
      res.data = (res.data || []).map((item, index) => {
        return {
          ...item,
          key: index,
        };
      });
      if (limit_id) {
        state.orderData.blanceRecord.push(...res.data);
      } else {
        state.orderData.blanceRecord = res.data;
      }
      state.dataEnding.blanceRecord = !res.data.length;
    } finally {
      state.dataLoading.blanceRecord = false;
    }
  }, 200);

  // 查询日志
  const getLog = debounce(async () => {}, 200);

  /** 获取盈亏
   * @param params {
   *  symbol: 商品
   *  closePrice: 平仓价格
   *  buildPrice: 建仓价格
   *  volume: 手数
   *  fee: 手续费(可选)
   *  storage: 过夜费(可选)
   * }
   * @param direction: buy or sell
   * @returns string
   * @description
   * 后币种 === 账户币种 ->
   *  buy: 盈亏=(平仓价格-建仓价格)*手数*合约数量;
   *  sell:盈亏=(建仓价格-平仓价格)*手数*合约数量
   * 前商品 === 账户币种 ->
   *  buy: 盈亏=(平仓价格-建仓价格)*手数*合约数量/平仓价格;
   *  sell:盈亏=(建仓价格-平仓价格)*手数*合约数量/平仓价格
   * 其他(买卖单) ->
   *  buy: 盈亏=(平仓价格-建仓价格)*手数*合约数量*商品币种(后)与账户币种汇率；
   *  sell:盈亏=(建仓价格-平仓价格)*手数*合约数量*商品币种(后)与账户币种汇率
   */
  const getProfit = (
    params: {
      symbol: string;
      closePrice: number;
      buildPrice: number;
      volume: number;
      fee?: number;
      storage?: number;
    },
    direction: "sell" | "buy"
  ): string => {
    const userStore = useUser();
    const symbolsStore = useSymbols();
    const rateStore = useRate();
    const { symbol, closePrice, buildPrice, volume, fee, storage } = params;

    const rates = rateStore.getRate(symbol);
    const loginInfo = userStore.state.loginInfo;
    const symbolInfo = symbolsStore.symbols.find((e) => e.symbol === symbol);
    if (symbolInfo) {
      const { currency, pre_currency, contract_size } = symbolInfo;
      const userCur = loginInfo?.currency; // 账户币种
      const stateMachine = {
        last_user: {
          buy: (closePrice - buildPrice) * volume * contract_size,
          sell: (buildPrice - closePrice) * volume * contract_size,
        },
        pre_user: {
          buy:
            (closePrice - buildPrice) * volume * (contract_size / closePrice),
          sell:
            (buildPrice - closePrice) * volume * (contract_size / closePrice),
        },
        normal: {
          buy:
            (closePrice - buildPrice) *
            volume *
            contract_size *
            rates.last_user.bid_rate,
          sell:
            (buildPrice - closePrice) *
            volume *
            contract_size *
            rates.last_user.bid_rate,
        },
      };
      const type =
        currency === userCur
          ? "last_user"
          : pre_currency === userCur
          ? "pre_user"
          : "normal";
      const result = stateMachine[type][direction];
      return round(result + (fee || 0) + (storage || 0), 2);
    }
    return "-";
  };

  /** 参考预付款
   * @param params { symbol: 商品; volume: 手数; bulidPrice: 建仓价格 }
   * @returns string
   * @description
   * 有杠杆时：
   * 商品前币种 === 账户币种
   *  是： 预付款 = 手数 * 合约数量  / 杠杆
   *  否： 商品后币种 === 账户币种
   *        是： 预付款  = 手数 * 合约数量 * 建仓价格 / 杠杆
   *        否： 预付款 = 手数 * 合约数量 * 前币种与账户币种汇率 / 杠杆
   * 无杠杆时
   *  margin * 手数
   */
  const getReferMargin = (params: {
    symbol: string;
    volume: string | number;
    bulidPrice: string | number;
  }) => {
    const { symbol, volume, bulidPrice } = params;
    const rateStore = useRate();
    const symbolsStore = useSymbols();
    const userStore = useUser();

    const rates = rateStore.getRate(symbol).pre_user;
    const rate = rates.bid_rate;

    const loginInfo = userStore.state.loginInfo;
    const userCur = loginInfo?.currency; // 账户币种
    const symbolInfo = symbolsStore.symbols.find((e) => e.symbol === symbol);
    if (symbolInfo && volume) {
      const { currency, pre_currency, contract_size, leverage, margin } =
        symbolInfo;
      if (leverage) {
        if (pre_currency === userCur) {
          return (+volume * contract_size) / leverage;
        }
        if (currency === userCur) {
          return (+volume * contract_size * +bulidPrice) / leverage;
        }
        return (+volume * contract_size * rate) / leverage;
      }
      return margin * +volume;
    }
    return "-";
  };

  // 手数增加
  const volumeAdd = (value: number, step: number) => {
    let dValue = new Decimal(value);
    let dStep = new Decimal(step);
    let result = dValue.plus(dStep);
    // 需满足是step的倍数
    let remainder = result.mod(dStep);
    if (remainder.toNumber() !== 0) {
      result = dValue.plus(dStep.sub(remainder));
    }
    return result.toNumber();
  };

  // 手数减少
  const volumeSub = (value: number, step: number, min?: number) => {
    let dValue = new Decimal(value);
    let dStep = new Decimal(step);
    let result = dValue.sub(dStep);
    let remainder = result.mod(dStep);
    if (!isNil(min) && result.toNumber() < min) {
      result = new Decimal(min);
    } else if (remainder.toNumber() !== 0) {
      result = dValue.sub(remainder);
    }
    return result.toNumber();
  };

  function $reset() {
    state.initOrderState = { symbol: "" };
    state.currentKline = {};
    state.orderData = {
      marketOrder: [],
      pendingOrder: [],
      pendingOrderHistory: [],
      marketOrderHistory: [],
      blanceRecord: [],
      log: [],
    };
    state.dataLoading = {
      marketOrder: false,
      pendingOrder: false,
      pendingOrderHistory: false,
      marketOrderHistory: false,
      blanceRecord: false,
      log: false,
    };
    state.dataEnding = {
      marketOrder: false,
      pendingOrder: false,
      pendingOrderHistory: false,
      marketOrderHistory: false,
      blanceRecord: false,
      log: false,
    };
    state.dataFilter = {
      marketOrder: {
        symbol: [],
        direction: null,
        pol: null,
      },
      pendingOrder: {
        symbol: [],
      },
      pendingOrderHistory: {
        symbol: [],
        createTime: [],
        addTime: [],
        closeTime: [],
      },
      marketOrderHistory: {
        symbol: [],
        createTime: [],
        addTime: [],
        closeTime: [monday, today],
      },
      blanceRecord: {
        createTime: [],
        pol: null,
      },
      log: {
        date: "",
        source: "",
        type: "",
      },
    };
    state.ifOne = null; // 一键交易
    state.ifQuick = true; // 快捷交易(图表是否显示快捷交易组件)
  }

  return {
    state,
    createOrder,
    setOneTrans,
    getOneTrans,
    getQuickTrans,
    getData,
    initTableData,
    getMarketOrders,
    getPendingOrders,
    getPendingOrderHistory,
    getMarketOrderHistory,
    getBlanceRecord,
    getLog,
    getProfit,
    getReferMargin,
    volumeAdd,
    volumeSub,
    $reset,
  };
});
