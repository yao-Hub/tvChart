import { defineStore } from "pinia";

import { Socket } from "socket.io-client";
import SingletonSocket from "utils/socket";

import { useUser } from "./user";
import { useNetwork } from "./network";
import { useVersion } from "./version";

import { IRate, ISocketKlineNew, ISocketQuote } from "@/types/chart";
import { encrypt } from "utils/DES/JS";
import { generateUUID } from "@/utils/common";

interface IQuote {
  ask: number;
  ask_size: number;
  bid: number;
  bid_size: number;
}
type TFooname =
  | "emitKlineQuote"
  | "unsubKlineQuote"
  | "subQuote"
  | "subKline"
  | "sendToken"
  | "subQuoteDepth"
  | "orderChanges"
  | "emitQuoteDepth"
  | "emitRate"
  | "subRate"
  | "unSubRate"
  | "unSubQuoteDepth";

interface IState {
  socket: Socket | null;
  delayMap: Record<string, string | number>; // 各个网路节点延迟
  instance: SingletonSocket;
  // socket未初始化时，若调用了方法则先存储方法，等待socket初始化后再去执行
  noExecuteList: Array<{
    fooName: TFooname;
    options?: any;
  }>;
}
interface ChartProps {
  resolution: string | number;
  symbol: string;
}
export const useSocket = defineStore("socket", {
  state: (): IState => ({
    instance: new SingletonSocket(),
    socket: null,
    delayMap: {},
    noExecuteList: [],
  }),

  actions: {
    getUriQuery(): string {
      const searchMap: Record<string, string> = {
        "x-u-platform": "web",
        "x-u-device-id": useVersion().deviceId,
        server: useNetwork().server || useUser().account.server,
        action: "connect",
      };
      const keyMap = {
        server: useUser().account.server,
        req_id: generateUUID(),
        req_time: new Date().getTime(),
      };
      const enKeyMap = encrypt(JSON.stringify(keyMap));
      searchMap.d = btoa(enKeyMap);
      const queryParams = Object.entries(searchMap)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
      return `?${queryParams}`;
    },

    initSocket() {
      const networkStore = useNetwork();
      const mainUri = networkStore.currentNode?.webWebsocket;
      if (mainUri) {
        const query = this.getUriQuery();
        this.socket = this.instance.getInstance(mainUri, query);
        while (this.noExecuteList.length) {
          const item = this.noExecuteList.shift();
          if (item) {
            this[item.fooName](item.options);
          }
        }
      }
    },

    // 订阅k线和报价
    emitKlineQuote({ resolution, symbol }: ChartProps) {
      const userStore = useUser();
      const updata = {
        platform: "web",
        server: userStore.account.server,
        symbol_period_type: [
          {
            symbol: symbol,
            period_type: resolution,
          },
        ],
      };
      if (this.socket) {
        this.socket.emit("subscribe_kline", updata);
        this.socket.emit("subscribe_quote", {
          server: userStore.account.server,
          symbols: [symbol],
        });
      } else {
        this.noExecuteList.push({
          fooName: "emitKlineQuote",
          options: { resolution, symbol },
        });
      }
    },

    subQuote(callback: (e: ISocketQuote) => void) {
      if (this.socket) {
        this.socket.on("quote", (d) => {
          callback(d);
        });
      } else {
        this.noExecuteList.push({
          fooName: "subQuote",
          options: callback,
        });
      }
    },

    subKline(callback: (e: ISocketKlineNew) => void) {
      if (this.socket) {
        this.socket.on("kline_new", (d) => {
          callback(d);
        });
      } else {
        this.noExecuteList.push({
          fooName: "subKline",
          options: callback,
        });
      }
    },

    // 取消订阅k线和报价
    unsubKlineQuote({ resolution, symbol }: ChartProps) {
      const userStore = useUser();

      if (this.socket) {
        this.socket.emit("unsubscribe_kline", {
          server: userStore.account.server,
          symbol_period_type: [
            {
              symbol,
              period_type: resolution,
            },
          ],
        });
        this.socket.emit("unsubscribe_qoute", {
          server: userStore.account.server,
          symbol_period_type: [symbol],
        });
      } else {
        this.noExecuteList.push({
          fooName: "unsubKlineQuote",
          options: { resolution, symbol },
        });
      }
    },

    // 验证登录信息绑定交易账户
    sendToken({ login, token }: { login: string | number; token: string }) {
      const userStore = useUser();
      if (this.socket) {
        this.socket.emit("set_login", {
          server: userStore.account.server,
          login,
          token,
        });
      } else {
        this.noExecuteList.push({
          fooName: "sendToken",
          options: { login, token },
        });
      }
    },

    orderChanges(callback: (type: string) => void) {
      if (this.socket) {
        // 监听订单已建仓
        this.socket.on("order_opened", function (d: unknown) {
          console.log("order_opened", JSON.stringify(d));
          callback("order_opened");
        });
        // 监听订单已平仓
        this.socket.on("order_closed", function (d: unknown) {
          console.log("order_closed", JSON.stringify(d));
          callback("order_opened");
        });
        // 监听订单已修改（止盈止损）
        this.socket.on("order_modified", function (d: unknown) {
          console.log("order_modified", JSON.stringify(d));
          callback("order_modified");
        });
        // 监听挂单已创建
        this.socket.on("pending_order_opened", function (d: unknown) {
          console.log("pending_order_opened", JSON.stringify(d));
          callback("pending_order_opened");
        });
        // 监听挂单已删除
        this.socket.on("pending_order_deleted", function (d: unknown) {
          console.log("pending_order_deleted", JSON.stringify(d));
          callback("pending_order_deleted");
        });
        // 监听挂单已更新
        this.socket.on("pending_order_modified", function (d: unknown) {
          console.log("pending_order_modified", JSON.stringify(d));
          callback("pending_order_modified");
        });
        // 监听挂单已成交
        this.socket.on("pending_order_dealt", function (d: unknown) {
          console.log("pending_order_dealt", JSON.stringify(d));
          callback("pending_order_dealt");
        });
        // 监听出入金
        this.socket.on("balance_order_added", function (d: unknown) {
          console.log("balance_order_added", JSON.stringify(d));
          callback("balance_order_added");
        });
      } else {
        this.noExecuteList.push({
          fooName: "orderChanges",
          options: callback,
        });
      }
    },

    // 发送市场深度监听
    emitQuoteDepth(symbols: string[], callback?: Function) {
      const userStore = useUser();
      if (this.socket) {
        this.socket.emit("subscribe_quote_depth", {
          server: userStore.account.server,
          symbols,
        });
        if (callback) {
          callback();
        }
      } else {
        this.noExecuteList.push({
          fooName: "emitQuoteDepth",
          options: symbols,
        });
      }
    },

    // 市场深度返回监听
    subQuoteDepth(callback: (symbol: string, quotes: IQuote[]) => void) {
      if (this.socket) {
        this.socket.on("quote_depth", (d: any) => {
          callback(d.symbol, d.quotes);
        });
      } else {
        this.noExecuteList.push({
          fooName: "subQuoteDepth",
          options: callback,
        });
      }
    },

    //取消订阅市场深度
    unSubQuoteDepth(symbols: string[]) {
      if (this.socket) {
        const userStore = useUser();
        this.socket.emit("unsubscribe_quote_depth", {
          server: userStore.account.server,
          symbols,
        });
      } else {
        this.noExecuteList.push({
          fooName: "unSubQuoteDepth",
        });
      }
    },

    // 订阅汇率
    emitRate() {
      if (this.socket) {
        const userStore = useUser();
        this.socket.emit("subscribe_rate", {
          server: userStore.account.server,
        });
      } else {
        this.noExecuteList.push({
          fooName: "emitRate",
        });
      }
    },

    subRate(callback: (e: IRate) => void) {
      if (this.socket) {
        this.socket.on("rate", (d) => {
          callback(d);
        });
      } else {
        this.noExecuteList.push({
          fooName: "subRate",
          options: callback,
        });
      }
    },

    //取消订阅汇率
    unSubRate() {
      if (this.socket) {
        const userStore = useUser();
        this.socket.emit("unsubscribe_rate", {
          server: userStore.account.server,
        });
      } else {
        this.noExecuteList.push({
          fooName: "unSubRate",
        });
      }
    },

    // 获取socket延迟
    getDelay(callback?: Function) {
      const networkStore = useNetwork();
      const wsUriList = networkStore.nodeList.map((item) => item.webWebsocket);
      const query = this.getUriQuery();
      this.instance.getSocketDelay(wsUriList, query, (e) => {
        if (callback) {
          callback(e);
        }
      });
    },

    $reset() {
      if (this.socket) {
        this.socket.close();
      }
      this.socket = null;
      this.delayMap = {};
      this.noExecuteList = [];
    },
  },
});
