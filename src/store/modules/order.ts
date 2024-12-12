import * as orders from "api/order/index";
import { ElMessageBox } from "element-plus";
import { isNil } from "lodash";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";
import { useChartAction } from "./chartAction";
import { useDialog } from "./dialog";
import { useSocket } from "./socket";
import { useStorage } from "./storage";
import { useUser } from "./user";

import * as types from "#/chart/index";
import * as orderTypes from "#/order";

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
  quotesClass: Record<
    string,
    {
      ask: string;
      bid: string;
    }
  >;
  currentQuotes: Record<string, types.IQuote>;
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
      quotesClass: {},
      currentQuotes: {},
      initOrderState: { symbol: "" },
      currentKline: {},
      orderData: {
        marketOrder: [],
        pendingOrder: [],
        pendingOrderHistory: [],
        marketOrderHistory: [],
        blanceRecord: [],
      },
      dataLoading: {
        marketOrder: false,
        pendingOrder: false,
        pendingOrderHistory: false,
        marketOrderHistory: false,
        blanceRecord: false,
      },
      dataEnding: {
        marketOrder: false,
        pendingOrder: false,
        pendingOrderHistory: false,
        marketOrderHistory: false,
        blanceRecord: false,
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
      },
      ifOne: false, // 一键交易
      ifQuick: true, // 快捷交易(图表是否显示快捷交易组件)
    };
  },

  actions: {
    createOrder<T extends ModeType>(
      params?: OrderStateWithDirectionRequired<T>
    ) {
      const dialogStore = useDialog();
      const userStore = useUser();
      if (!userStore.account.token) {
        ElMessageBox.confirm("", "未登录", {
          confirmButtonText: "去登录",
          cancelButtonText: "取消",
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
        ElMessageBox.alert("当前账户禁止交易", "无权限", {
          confirmButtonText: "确认",
          type: "error",
        });
        return;
      }
      if (params) {
        this.initOrderState = { ...params };
      }
      dialogStore.showOrderDialog();
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

    async initTableData() {
      const userStore = useUser();
      const socketStore = useSocket();

      await Promise.all([
        this.getMarketOrders(),
        this.getPendingOrders(),
        this.getMarketOrderHistory(),
        this.getPendingOrderHistory(),
        this.getBlanceRecord(),
      ]);

      socketStore.orderChanges(async (type: string) => {
        switch (type) {
          case "order_opened":
            await Promise.all([
              this.getMarketOrders(),
              userStore.getLoginInfo(),
            ]);
            break;
          case "order_closed":
            await Promise.all([
              this.getMarketOrders(),
              this.getMarketOrderHistory(),
              this.getBlanceRecord(),
              userStore.getLoginInfo(),
            ]);
            break;
          case "order_modified":
            await this.getMarketOrders();
            break;
          case "pending_order_opened":
          case "pending_order_modified":
            await this.getPendingOrders();
            break;
          case "pending_order_deleted":
            await Promise.all([
              this.getPendingOrders(),
              this.getPendingOrderHistory(),
            ]);
            break;
          case "pending_order_dealt":
            await Promise.all([
              this.getMarketOrders(),
              this.getPendingOrders(),
              userStore.getLoginInfo(),
            ]);
            break;
          case "balance_order_added":
            await Promise.all([
              this.getBlanceRecord(),
              userStore.getLoginInfo(),
            ]);
            break;
          default:
            break;
        }
      });
    },

    // 查询持仓
    async getMarketOrders() {
      try {
        this.dataLoading.marketOrder = true;
        const res = await orders.openningOrders();
        if (res.data) {
          res.data = res.data.map((item, index) => {
            return {
              ...item,
              key: index,
            };
          });
          this.orderData.marketOrder = res.data;
        }
      } finally {
        this.dataLoading.marketOrder = false;
      }
    },

    // 查询挂单（有效）
    async getPendingOrders() {
      try {
        this.dataLoading.pendingOrder = true;
        const res = await orders.pendingOrders();
        if (res.data) {
          res.data = res.data.map((item, index) => {
            return {
              ...item,
              key: index,
            };
          });
          this.orderData.pendingOrder = res.data;
        }
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
        res.data = res.data.map((item, index) => {
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
        res.data = res.data.map((item, index) => {
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
        res.data = res.data.map((item, index) => {
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
  },

  debounce: {
    getMarketOrders: 300,
    getPendingOrders: 300,
    getPendingOrderHistory: 300,
    getMarketOrderHistory: 300,
    getBlanceRecord: 300,
  },
});
