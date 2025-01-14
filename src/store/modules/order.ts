import i18n from "@/language/index";
import Decimal from "decimal.js";
import { ElMessageBox } from "element-plus";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";

import { useChartAction } from "./chartAction";
import { useDialog } from "./dialog";
import { useRate } from "./rate";
import { useSocket } from "./socket";
import { useStorage } from "./storage";
import { useSymbols } from "./symbols";
import { useUser } from "./user";

import * as types from "#/chart/index";
import * as orderTypes from "#/order";
import * as orders from "api/order/index";

import { isNil } from "lodash";
import { round } from "utils/common/index";

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

interface State {
  initOrderState: OrderStateWithDirectionRequired<ModeType>;
  currentKline: Record<string, types.ILine>;
  orderData: orderTypes.TableData;
  dataLoading: Record<orderTypes.TableDataKey, boolean>;
  dataEnding: Record<orderTypes.TableDataKey, boolean>;
  dataFilter: Record<orderTypes.TableDataKey, any>;
  ifOne: boolean | null;
  ifQuick: boolean;
}

export const useOrder = defineStore("order", {
  state: (): State => {
    return {
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
          closeTime: [],
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
    };
  },

  actions: {
    createOrder<T extends ModeType>(
      params?: OrderStateWithDirectionRequired<T>
    ) {
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
      if (userStore.loginInfo?.trade_rights !== 1) {
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
        this.initOrderState = { ...params };
      }
      dialogStore.openDialog("orderDialogVisible");
    },

    // 设置一键交易状态
    setOneTrans(result: boolean) {
      const storageStore = useStorage();
      this.ifOne = result;
      storageStore.setItem("ifOne", result);
    },

    // 获取一键交易状态
    getOneTrans() {
      const storageStore = useStorage();
      const ifOne = storageStore.getItem("ifOne");
      this.ifOne = isNil(ifOne) ? null : ifOne;
      return this.ifOne;
    },

    // 获取快捷交易状态
    getQuickTrans() {
      const storageStore = useStorage();
      const sto = storageStore.getItem("ifQuick");
      this.ifQuick = isNil(sto) ? true : sto;
      return this.ifQuick;
    },

    async getData(type: string) {
      const userStore = useUser();
      switch (type) {
        // 监听订单已建仓
        case "order_opened":
          await Promise.all([this.getMarketOrders(), userStore.getLoginInfo()]);
          break;
        // 监听订单已平仓
        case "order_closed":
          await Promise.all([
            this.getMarketOrders(),
            this.getMarketOrderHistory(),
            this.getBlanceRecord(),
            userStore.getLoginInfo(),
          ]);
          break;
        // 监听订单已修改（止盈止损）
        case "order_modified":
          await this.getMarketOrders();
          break;
        // 监听挂单已创建
        // 监听挂单已更新;
        // 监听 stop limit 挂单 已触及 stop
        case "pending_order_opened":
        case "pending_order_modified":
        case "pending_order_valided":
          await this.getPendingOrders();
          break;
        // 监听挂单已删除
        case "pending_order_deleted":
          await Promise.all([
            this.getPendingOrders(),
            this.getPendingOrderHistory(),
          ]);
          break;
        // 监听挂单已成交
        case "pending_order_dealt":
          await Promise.all([
            this.getMarketOrders(),
            this.getPendingOrders(),
            userStore.getLoginInfo(),
          ]);
          break;
        // 监听出入金
        case "balance_order_added":
          await Promise.all([this.getBlanceRecord(), userStore.getLoginInfo()]);
          break;
        default:
          break;
      }
    },
    async initTableData() {
      const socketStore = useSocket();
      await Promise.all([
        this.getMarketOrders(),
        this.getPendingOrders(),
        this.getMarketOrderHistory(),
        this.getPendingOrderHistory(),
        this.getBlanceRecord(),
      ]);

      socketStore.orderChanges(async (type: string) => {
        this.getData(type);
      });
    },

    // 查询持仓
    async getMarketOrders() {
      try {
        this.dataLoading.marketOrder = true;
        const res = await orders.openningOrders();
        res.data = (res.data || []).map((item, index) => {
          return {
            ...item,
            key: index,
          };
        });
        this.orderData.marketOrder = res.data;
      } finally {
        this.dataLoading.marketOrder = false;
      }
    },

    // 查询挂单（有效）
    async getPendingOrders() {
      try {
        this.dataLoading.pendingOrder = true;
        const res = await orders.pendingOrders();
        res.data = (res.data || []).map((item, index) => {
          return {
            ...item,
            key: index,
          };
        });
        this.orderData.pendingOrder = res.data;
      } finally {
        this.dataLoading.pendingOrder = false;
      }
    },

    // 查询挂单历史（失效）
    async getPendingOrderHistory(limit_id?: number) {
      try {
        this.dataLoading.pendingOrderHistory = true;
        const [begin_time, end_time] =
          this.dataFilter.pendingOrderHistory.createTime;
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
          this.orderData.pendingOrderHistory.push(...res.data);
        } else {
          this.orderData.pendingOrderHistory = res.data;
        }
        this.dataEnding.pendingOrderHistory = !res.data.length;
      } finally {
        this.dataLoading.pendingOrderHistory = false;
      }
    },

    // 查询交易历史
    async getMarketOrderHistory(limit_id?: number) {
      try {
        this.dataLoading.marketOrderHistory = true;
        const { addTime, closeTime } = this.dataFilter.marketOrderHistory;
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
          this.orderData.marketOrderHistory.push(...res.data);
        } else {
          this.orderData.marketOrderHistory = res.data;
        }
        this.dataEnding.marketOrderHistory = !res.data.length;
      } finally {
        this.dataLoading.marketOrderHistory = false;
      }
    },

    // 查询出入金记录
    async getBlanceRecord(limit_id?: number) {
      try {
        this.dataLoading.blanceRecord = true;
        const { createTime } = this.dataFilter.blanceRecord;
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
          this.orderData.blanceRecord.push(...res.data);
        } else {
          this.orderData.blanceRecord = res.data;
        }
        this.dataEnding.blanceRecord = !res.data.length;
      } finally {
        this.dataLoading.blanceRecord = false;
      }
    },

    // 查询日志
    async getLog() {},

    /** 获取盈亏
     * @param params {
     *  symbol: 品种
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
     * 前品种 === 账户币种 ->
     *  buy: 盈亏=(平仓价格-建仓价格)*手数*合约数量/平仓价格;
     *  sell:盈亏=(建仓价格-平仓价格)*手数*合约数量/平仓价格
     * 其他(买卖单) ->
     *  buy: 盈亏=(平仓价格-建仓价格)*手数*合约数量*品种币种(后)与账户币种汇率；
     *  sell:盈亏=(建仓价格-平仓价格)*手数*合约数量*品种币种(后)与账户币种汇率
     */
    getProfit(
      params: {
        symbol: string;
        closePrice: number;
        buildPrice: number;
        volume: number;
        fee?: number;
        storage?: number;
      },
      direction: "sell" | "buy"
    ): string {
      const userStore = useUser();
      const symbolsStore = useSymbols();
      const rateStore = useRate();
      const {
        symbol,
        closePrice,
        buildPrice,
        volume,
        fee = 0,
        storage = 0,
      } = params;

      const rates = rateStore.getRate(symbol);
      const loginInfo = userStore.loginInfo;
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
              rates.last_user.ask_rate,
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
        return round(result + fee + storage, 2);
      }
      return "-";
    },

    /** 参考预付款
     * @param params { symbol: 品种; volume: 手数; bulidPrice: 建仓价格 }
     * @returns string
     * @description
     * 有杠杆时：
     * 品种前币种 === 账户币种
     *  是： 预付款 = 手数 * 合约数量  / 杠杆
     *  否： 品种后币种 === 账户币种
     *        是： 预付款  = 手数 * 合约数量 * 建仓价格 / 杠杆
     *        否： 预付款 = 手数 * 合约数量 * 前币种与账户币种汇率 / 杠杆
     * 无杠杆时
     *  margin * 手数
     */
    getReferMargin(
      params: {
        symbol: string;
        volume: string | number;
        bulidPrice: string | number;
      },
      direction: "sell" | "buy"
    ) {
      const { symbol, volume, bulidPrice } = params;
      const rateStore = useRate();
      const symbolsStore = useSymbols();
      const userStore = useUser();

      const rates = rateStore.getRate(symbol).pre_user;
      const rate = direction === "buy" ? rates.ask_rate : rates.bid_rate;

      const loginInfo = userStore.loginInfo;
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
          return (+volume * contract_size * +bulidPrice * rate) / leverage;
        }
        return margin * +volume;
      }
      return "-";
    },

    // 手数增加
    volumeAdd(value: number, step: number) {
      let dValue = new Decimal(value);
      let dStep = new Decimal(step);
      let result = dValue.plus(dStep);
      // 需满足是step的倍数
      let remainder = result.mod(dStep);
      if (remainder.toNumber() !== 0) {
        result = dValue.plus(dStep.sub(remainder));
      }
      return result.toNumber();
    },

    // 手数减少
    volumeSub(value: number, step: number, min?: number) {
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
    },
  },

  debounce: {
    getMarketOrders: 300,
    getPendingOrders: 300,
    getPendingOrderHistory: 300,
    getMarketOrderHistory: 300,
    getBlanceRecord: 300,
    getData: 300,
  },
});
