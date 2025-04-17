import i18n from "@/language/index";
import dayjs from "dayjs";
import Decimal from "decimal.js";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { defineStore } from "pinia";
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";

import { useChartAction } from "./chartAction";
import { useDialog } from "./dialog";
import { useQuotes } from "./quotes";
import { useRate } from "./rate";
import { useSocket } from "./socket";
import { useStorage } from "./storage";
import { useSymbols } from "./symbols";
import { useUser } from "./user";

import * as orderTypes from "#/order";
import * as types from "@/types/chart";
import * as orders from "api/order/index";

import { debounce, get, isNil } from "lodash";
import { getTradingDirection, getOrderType } from "utils/order/index";
import { logIndexedDB } from "utils/IndexedDB/logDatabase";
import { getSymbolDetail } from "api/symbols";

type ModeType = "create" | "confirm";
type OrderStateWithDirectionRequired<T extends ModeType> = T extends "confirm"
  ? {
      symbol: string;
      volume: string;
      type: 0 | 1;
      mode: T;
    }
  : {
      symbol: string;
      volume?: string;
      type?: 0 | 1;
      mode?: T;
    };

interface IState {
  initOrderState: OrderStateWithDirectionRequired<ModeType> | null;
  currentKline: Record<string, types.ILine>;
  orderData: orderTypes.TableData;
  dataLoading: Record<orderTypes.TableTabKey, boolean>;
  dataEnding: Record<orderTypes.TableTabKey, boolean>;
  dataFilter: Record<orderTypes.TableTabKey, any>;
  ifOne: boolean | null;
  ifQuick: boolean;
}

export const useOrder = defineStore("order", () => {
  const t = i18n.global.t;
  const dateFormat = "YYYY-MM-DD HH:mm:ss";
  const monday = dayjs().startOf("week").startOf("day").format(dateFormat);
  const today = dayjs().endOf("day").format(dateFormat);
  const state = reactive<IState>({
    initOrderState: null,
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
        day: dayjs().format("YYYY.MM.DD"),
        origin: "",
        type: "",
      },
    },
    ifOne: null, // 一键交易
    ifQuick: true, // 快捷交易(图表是否显示快捷交易组件)
  });

  const currentLogin = computed(() => useUser().account.login);

  // 市价单盈亏
  const quotesStore = useQuotes();
  watch(
    () => quotesStore.qoutes,
    (qoutes) => {
      state.orderData.marketOrder.forEach((item) => {
        const { volume, symbol, open_price, type, fee, storage, pre_currency } =
          item;
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
            pre_currency,
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

  const getData = (type: string) => {
    const userStore = useUser();
    switch (type) {
      // 单个平仓
      case "single_marketOrder_close":
        Promise.all([getMarketOrderHistory(), userStore.getLoginInfo()]);
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
  };
  const initTableData = async () => {
    const socketStore = useSocket();
    await getMarketOrders();
    // await Promise.all([
    //   getPendingOrders(),
    //   getMarketOrderHistory(),
    //   getPendingOrderHistory(),
    //   getBlanceRecord(),
    // ]);

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
  const getLog = async () => {
    const filters = {
      server: useUser().account.server,
      login: useUser().account.login,
      ...state.dataFilter.log,
    };
    for (const i in filters) {
      if (filters[i] === "") {
        delete filters[i];
      }
    }
    state.orderData.log = (await logIndexedDB.optimizedFilter(
      filters
    )) as orderTypes.ILog[];
  };

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
      pre_currency?: string;
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
      const preCurrency = params.pre_currency || pre_currency; // 前置币种
      const userCur = loginInfo?.currency; // 账户币种
      const closePriceDec = new Decimal(closePrice);
      const buildPriceDec = new Decimal(buildPrice);
      const volumeDec = new Decimal(volume);
      const contractSizeDec = new Decimal(contract_size);
      const feeDec = fee ? new Decimal(fee) : new Decimal(0);
      const storageDec = storage ? new Decimal(storage) : new Decimal(0);
      const bidRateDec = new Decimal(rates.last_user.bid_rate);

      const stateMachine = {
        last_user: {
          buy: closePriceDec
            .sub(buildPriceDec)
            .mul(volumeDec)
            .mul(contractSizeDec),
          sell: buildPriceDec
            .sub(closePriceDec)
            .mul(volumeDec)
            .mul(contractSizeDec),
        },
        pre_user: {
          buy: closePriceDec
            .sub(buildPriceDec)
            .mul(volumeDec)
            .mul(contractSizeDec.div(closePriceDec)),
          sell: buildPriceDec
            .sub(closePriceDec)
            .mul(volumeDec)
            .mul(contractSizeDec.div(closePriceDec)),
        },
        normal: {
          buy: closePriceDec
            .sub(buildPriceDec)
            .mul(volumeDec)
            .mul(contractSizeDec)
            .mul(bidRateDec),
          sell: buildPriceDec
            .sub(closePriceDec)
            .mul(volumeDec)
            .mul(contractSizeDec)
            .mul(bidRateDec),
        },
      };
      const type =
        currency === userCur
          ? "last_user"
          : preCurrency === userCur
          ? "pre_user"
          : "normal";

      const result = stateMachine[type][direction];
      const finalResult = result.add(feeDec).add(storageDec).toFixed(2);
      return finalResult;
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

  const getLogData = () => {
    return {
      id: new Date().getTime(),
      origin: "trades",
      time: dayjs().format("YYYY.MM.DD HH:mm:ss.SSS"),
      login: currentLogin.value,
      day: dayjs().format("YYYY.MM.DD"),
      server: useUser().account.server,
    };
  };

  // 是否休市
  const getTradAble = async (symbol: string) => {
    const res = await getSymbolDetail({
      symbol,
      group: useUser().state.loginInfo!.group,
    });
    if (res.data && res.data.current_trade_able === 0) {
      ElMessage.warning(t("tip.marketClosed"));
    }
    return res.data && res.data.current_trade_able === 0;
  };

  // 增加市价单
  const addMarketOrder = (updata: orders.ReqOrderAdd) => {
    let errmsg = "";
    let logStr = "";
    const { volume, symbol, type } = updata;
    const direction = type ? "sell" : "buy";

    logStr = `${direction} ${volume} ${symbol} `;

    if (updata.sl) {
      logStr += `sl:${updata.sl} `;
    }
    if (updata.tp) {
      logStr += `tp:${updata.tp} `;
    }
    return new Promise(async (resolve, reject) => {
      try {
        const res = await orders.marketOrdersAdd({
          ...updata,
          volume: +volume * 100,
        });
        logStr += `#${res.data.id} at ${res.data.open_price}`;
        if (res.data.action_success) {
          ElNotification.success({
            title: t("tip.succeed", { type: t("dialog.createOrder") }),
            message: t("dialog.createOrderSucceed", {
              type: t(`order.${direction}`),
              volume,
              symbol,
            }),
          });
          await Promise.all([getMarketOrders(), useUser().getLoginInfo()]);
          resolve(res);
        } else {
          errmsg = res.data.err_text || res.errmsg || "";
          reject(res);
        }
      } catch (error: any) {
        errmsg =
          get(error, "errmsg") ||
          get(error, "message") ||
          JSON.stringify(error);
        reject(error);
      } finally {
        if (errmsg) {
          ElNotification.error({
            title: t("tip.failed", { type: t("dialog.createOrder") }),
            message: t(errmsg),
          });
        }
        const logErr = errmsg ? `error ${errmsg}` : "";
        logStr = `${currentLogin.value}: market order ${logErr} ${logStr}`;
        const logData = {
          logType: errmsg ? "error" : "info",
          logName: "marketOrder",
          detail: logStr,
          ...getLogData(),
        };
        await logIndexedDB.addData(logData);
        getData("log");
      }
    });
  };

  // 编辑市价单
  const modifyMarketOrder = (
    updata: orders.reqEditOpeningOrders,
    originData: orders.resOrders
  ) => {
    let errmsg = "";
    let logStr = "";
    const { sl_price, tp_price, type, symbol, id, volume, open_price } =
      originData;
    const direction = getTradingDirection(type);
    logStr = `#${id}, ${direction} ${volume} ${symbol} at ${open_price}, sl:${sl_price} tp:${tp_price} -> `;
    if (updata.sl) {
      logStr += `sl:${updata.sl} `;
    }
    if (updata.tp) {
      logStr += `tp:${updata.tp} `;
    }
    return new Promise(async (resolve, reject) => {
      try {
        const res = await orders.editopenningOrders(updata);
        if (res.data.action_success) {
          getMarketOrders();
          ElNotification.success({
            title: t("tip.succeed", { type: `#${id} ${t("modify")}` }),
          });
          resolve(res);
        } else {
          errmsg = res.data.err_text || res.errmsg || "";
          reject(res);
        }
      } catch (error: any) {
        errmsg =
          get(error, "errmsg") ||
          get(error, "message") ||
          JSON.stringify(error);
        reject(error);
      } finally {
        if (errmsg) {
          ElNotification.error({
            title: t("tip.failed", { type: t("modify") }),
            message: `#${id}: ${t(errmsg)}`,
          });
        }
        const logErr = errmsg ? `error ${errmsg}` : "";
        logStr = `${currentLogin.value}: modify market order ${logErr} ${logStr}`;
        const logData = {
          logType: errmsg ? "error" : "info",
          logName: "modifyMarketOrder",
          detail: logStr,
          ...getLogData(),
        };
        await logIndexedDB.addData(logData);
        getData("log");
      }
    });
  };

  // 删除市价单
  const delMarketOrder = (updata: orders.reqMarketClose & { type: number }) => {
    let errmsg = "";
    let logStr = "";
    const { id, symbol, volume, type } = updata;
    const direction = getTradingDirection(type);
    logStr = `#${id} (${direction} ${volume} ${symbol} `;
    return new Promise(async (resolve, reject) => {
      try {
        const SDres = await getTradAble(symbol);
        if (SDres) {
          reject();
          return;
        }
        const res = await orders.marketOrdersClose({
          symbol,
          id,
          volume: volume * 100,
        });
        logStr += `at ${res.data.close_price})`;
        if (res.data.action_success) {
          logStr += `completed`;
          ElNotification.success({
            title: t("tip.succeed", { type: `#${id} ${t("close")}` }),
          });
          Promise.all([
            getMarketOrderHistory(),
            getBlanceRecord(),
            useUser().getLoginInfo(),
          ]);
          resolve(res);
        } else {
          errmsg = res.data.err_text || res.errmsg || "";
          reject(res);
        }
      } catch (error: any) {
        errmsg =
          get(error, "errmsg") ||
          get(error, "message") ||
          JSON.stringify(error);
        reject(error);
      } finally {
        if (errmsg) {
          ElNotification.error({
            title: t("tip.failed", { type: t("dialog.createOrder") }),
            message: `#${id}: ${t(errmsg)}`,
          });
        }
        const logErr = errmsg ? `error ${errmsg}` : "";
        logStr = `${currentLogin.value}: close market order ${logErr} ${logStr})`;
        const logData = {
          logType: errmsg ? "error" : "info",
          logName: "closeMarketOrder",
          detail: logStr,
          ...getLogData(),
        };
        await logIndexedDB.addData(logData);
        getData("log");
      }
    });
  };

  // 增加挂单
  const addPendingOrder = (updata: orders.reqPendingOrdersAdd) => {
    let errmsg = "";
    let logStr = "";
    const { type, volume, symbol } = updata;
    const orderType = getOrderType(type);
    logStr = `${orderType} ${volume} ${symbol} `;
    if (updata.sl) {
      logStr += `sl:${updata.sl} `;
    }
    if (updata.tp) {
      logStr += `tp:${updata.tp} `;
    }
    if (updata.time_expiration) {
      const time = dayjs(updata.time_expiration * 1000).format(
        "YYYY.MM.DD HH:mm:ss.SSS"
      );
      logStr += `time_expiration:${time} `;
    }
    return new Promise(async (resolve, reject) => {
      try {
        const res = await orders.pendingOrdersAdd({
          ...updata,
          volume: +volume * 100,
        });
        logStr = `#${res.data.id} ${logStr} at ${res.data.order_price}`;
        if (res.data.action_success) {
          getPendingOrders();
          ElNotification.success({
            title: t("tip.succeed", {
              type: `#${res.data.id} ${t("dialog.createOrder")}`,
            }),
          });
          resolve(res);
        } else {
          errmsg = res.data.err_text || res.errmsg || "";
          reject(res);
        }
      } catch (error: any) {
        errmsg =
          get(error, "errmsg") ||
          get(error, "message") ||
          JSON.stringify(error);
        reject(error);
      } finally {
        if (errmsg) {
          ElNotification.error({
            title: t("tip.failed", { type: t("dialog.createOrder") }),
            message: t(errmsg),
          });
        }
        const logErr = errmsg ? `error ${errmsg}` : "";
        logStr = `${currentLogin.value}: order ${logErr} ${logStr}`;
        const logData = {
          logType: errmsg ? "error" : "info",
          logName: "order",
          detail: logStr,
          ...getLogData(),
        };
        await logIndexedDB.addData(logData);
        getData("log");
      }
    });
  };

  // 编辑挂单
  const modifyPendingOrder = (
    updata: orders.reqPendingOrdersAdd & { id: string | number },
    originData: orders.resOrders
  ) => {
    let errmsg = "";
    let logStr = "";
    const {
      sl_price,
      tp_price,
      type,
      symbol,
      id,
      volume: originVolume,
      order_price,
    } = originData;
    const { volume } = updata;
    const orderType = getOrderType(type);
    logStr = `#${id}, ${orderType} ${
      originVolume / 100
    } ${symbol} at ${order_price}, sl:${sl_price} tp:${tp_price} -> `;
    if (updata.volume) {
      logStr += `volume:${updata.volume} `;
    }
    if (updata.sl) {
      logStr += `sl:${updata.sl} `;
    }
    if (updata.tp) {
      logStr += `tp:${updata.tp} `;
    }
    if (updata.time_expiration) {
      const time = dayjs(updata.time_expiration).format(
        "YYYY.MM.DD HH:mm:ss.SSS"
      );
      logStr += `time_expiration:${time} `;
    }
    return new Promise(async (resolve, reject) => {
      try {
        const res = await orders.editPendingOrders({
          ...updata,
          volume: +volume * 100,
        });
        if (res.data.action_success) {
          getPendingOrders();
          ElNotification.success({
            title: t("tip.succeed", {
              type: `#${id} ${t("modify")}`,
            }),
          });
          resolve(res);
        } else {
          errmsg = res.data.err_text || res.errmsg || "";
          reject(res);
        }
      } catch (error: any) {
        errmsg =
          get(error, "errmsg") ||
          get(error, "message") ||
          JSON.stringify(error);
        reject(error);
      } finally {
        if (errmsg) {
          ElNotification.error({
            title: t("tip.failed", { type: t("modify") }),
            message: `#${id} ${t(errmsg)}`,
          });
        }
        const logErr = errmsg ? `error ${errmsg}` : "";
        logStr = `${currentLogin.value}: modify order ${logErr} ${logStr}`;
        const logData = {
          logType: errmsg ? "error" : "info",
          logName: "modifyOrder",
          detail: logStr,
          ...getLogData(),
        };
        await logIndexedDB.addData(logData);
        getData("log");
      }
    });
  };

  // 删除挂单
  const delPendingOrder = (record: orders.resOrders) => {
    const { id, symbol, volume, type, order_price } = record;
    const orderType = getOrderType(type);
    let logStr = "";
    let errmsg = "";
    logStr = `#${id} (${orderType} ${
      volume / 100
    } ${symbol} at ${order_price})`;

    return new Promise(async (resolve, reject) => {
      try {
        const SDres = await getTradAble(symbol);
        if (SDres) {
          reject();
          return;
        }
        const res = await orders.delPendingOrders({
          id: record.id,
          symbol: record.symbol,
        });
        if (res.data.action_success) {
          logStr += " completed";
          const index = state.orderData.pendingOrder.findIndex(
            (e) => e.id === record.id
          );
          state.orderData.pendingOrder.splice(index, 1);
          ElNotification.success({
            title: t("tip.succeed", { type: `#${id} ${t("delete")}` }),
          });
          resolve(res);
        } else {
          errmsg = res.data.err_text || res.errmsg || "";
          reject(errmsg);
        }
      } catch (error: any) {
        errmsg =
          get(error, "errmsg") ||
          get(error, "message") ||
          JSON.stringify(error);
        reject(errmsg);
      } finally {
        if (errmsg) {
          ElNotification.error({
            title: t("tip.failed", { type: t("delete") }),
            message: `#${id} ${t(errmsg)}`,
          });
        }
        const logErr = errmsg ? `error ${errmsg}` : "";
        logStr = `${currentLogin.value}: close order ${logErr} ${logStr}`;
        const logData = {
          logType: errmsg ? "error" : "info",
          logName: "closeOrder",
          detail: logStr,
          ...getLogData(),
        };
        await logIndexedDB.addData(logData);
        getData("log");
      }
    });
  };

  function $reset() {
    state.initOrderState = null;
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
        day: dayjs().format("YYYY.MM.DD"),
        origin: "",
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
    addMarketOrder,
    modifyMarketOrder,
    delMarketOrder,
    addPendingOrder,
    modifyPendingOrder,
    delPendingOrder,
    getTradAble,
    $reset,
  };
});
