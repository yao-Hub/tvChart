import { defineStore } from "pinia";

import { Socket } from "socket.io-client";
import SingletonSocket from "utils/socket";

import { useUser } from "./user";
import { useNetwork } from "./network";
import { useSystem } from "./system";

import { IRate, ISocketKlineNew, ISocketQuote } from "@/types/chart";
import { encrypt } from "utils/DES/JS";
import { generateUUID } from "@/utils/common";

interface IQuote {
  ask: number;
  ask_size: number;
  bid: number;
  bid_size: number;
}
type TMainSocketFooname =
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

type TOnLineSocketFooname =
  | "sendOnlineToken"
  | "emitQrcodeInit"
  | "subQrcodeInit"
  | "subQrcodeLogin";

interface IState {
  mainSocket: Socket | null;
  mainInstance: SingletonSocket;
  // socket未初始化时，若调用了方法则先存储方法，等待socket初始化后再去执行
  mainSocketNoExecuteList: Array<{
    fooName: TMainSocketFooname;
    options?: any;
  }>;
  mainSocketEmitList: Array<{
    action: string;
    data: Record<string, unknown>;
  }>;

  onLineInstance: SingletonSocket;
  onLineSocket: Socket | null;
  onLineSocketNoExecuteList: Array<{
    fooName: TOnLineSocketFooname;
    options?: any;
  }>;
}
interface ChartProps {
  resolution: string | number;
  symbol: string;
}

export const useSocket = defineStore("socket", {
  state: (): IState => ({
    mainSocket: null,
    mainInstance: new SingletonSocket(),
    mainSocketNoExecuteList: [],
    mainSocketEmitList: [],

    onLineInstance: new SingletonSocket(),
    onLineSocket: null,
    onLineSocketNoExecuteList: [],
  }),

  actions: {
    reqData() {
      return {
        req_id: generateUUID(),
        req_time: new Date().getTime(),
      };
    },
    enData(data: any) {
      return encrypt(JSON.stringify(data));
    },

    async getUriQuery(
      action: string = "connect",
      dData: Record<string, string> = {}
    ) {
      if (!useSystem().systemInfo) {
        await useSystem().getSystemInfo();
      }
      const server = useUser().account.server || useNetwork().server;
      const searchMap: Record<string, string> = {
        "x-u-platform": "web",
        "x-u-device-id": useSystem().systemInfo!.deviceId,
        server,
        action,
      };
      const keyMap = {
        server,
        ...dData,
        ...this.reqData(),
      };
      const enKeyMap = this.enData(keyMap);
      searchMap.d = btoa(enKeyMap);
      const queryParams = Object.entries(searchMap)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
      return `?${queryParams}`;
    },

    async initMainSocket() {
      const networkStore = useNetwork();
      const mainUri = networkStore.currentNode?.webWebsocket;
      if (mainUri) {
        const query = await this.getUriQuery();
        this.mainSocket = this.mainInstance.getInstance(mainUri, query);
        while (this.mainSocketNoExecuteList.length) {
          const item = this.mainSocketNoExecuteList.shift();
          if (item) {
            this[item.fooName](item.options);
          }
        }
      }
    },

    // 订阅k线和报价
    emitKlineQuote({ resolution, symbol }: ChartProps) {
      if (this.mainSocket) {
        const userStore = useUser();
        const klineData = {
          server: userStore.account.server,
          symbol_period_type: [
            {
              symbol: symbol,
              period_type: resolution,
            },
          ],
        };
        this.mainSocket.emit("subscribe_kline", {
          action: "subscribe_kline",
          d: this.enData({
            ...this.reqData(),
            ...klineData,
          }),
        });
        const quoteData = {
          server: userStore.account.server,
          symbols: [symbol],
        };
        this.mainSocket.emit("subscribe_quote", {
          action: "subscribe_quote",
          d: this.enData({
            ...this.reqData(),
            ...quoteData,
          }),
        });
        this.mainSocketEmitList.push(
          {
            action: "subscribe_kline",
            data: klineData,
          },
          {
            action: "subscribe_quote",
            data: quoteData,
          }
        );
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "emitKlineQuote",
          options: { resolution, symbol },
        });
      }
    },

    subQuote(callback: (e: ISocketQuote) => void) {
      if (this.mainSocket) {
        this.mainSocket.on("quote", (d) => {
          callback(d);
        });
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "subQuote",
          options: callback,
        });
      }
    },

    subKline(callback: (e: ISocketKlineNew) => void) {
      if (this.mainSocket) {
        this.mainSocket.on("kline_new", (d) => {
          callback(d);
        });
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "subKline",
          options: callback,
        });
      }
    },

    // 取消订阅k线和报价
    unsubKlineQuote({ resolution, symbol }: ChartProps) {
      const userStore = useUser();

      if (this.mainSocket) {
        const klineData = {
          server: userStore.account.server,
          symbol_period_type: [
            {
              symbol,
              period_type: resolution,
            },
          ],
        };
        this.mainSocket.emit("unsubscribe_kline", {
          action: "unsubscribe_kline",
          d: this.enData({
            ...this.reqData(),
            ...klineData,
          }),
        });
        const quoteData = {
          server: userStore.account.server,
          symbols: [symbol],
        };
        this.mainSocket.emit("unsubscribe_qoute", {
          action: "unsubscribe_qoute",
          d: this.enData({
            ...this.reqData(),
            ...quoteData,
          }),
        });
        this.mainSocketEmitList.push(
          {
            action: "unsubscribe_kline",
            data: klineData,
          },
          {
            action: "unsubscribe_qoute",
            data: quoteData,
          }
        );
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "unsubKlineQuote",
          options: { resolution, symbol },
        });
      }
    },

    // 验证登录信息绑定交易账户
    sendToken({ login, token }: { login: string | number; token: string }) {
      const userStore = useUser();
      if (this.mainSocket) {
        const d = this.enData({
          ...this.reqData(),
          server: userStore.account.server,
          login,
          token,
        });
        this.mainSocket.emit("set_login", {
          action: "set_login",
          d,
        });
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "sendToken",
          options: { login, token },
        });
      }
    },

    orderChanges(callback: (type: string) => void) {
      if (this.mainSocket) {
        // 监听订单已建仓
        this.mainSocket.on("order_opened", function (d: unknown) {
          console.log("order_opened", JSON.stringify(d));
          callback("order_opened");
        });
        // 监听订单已平仓
        this.mainSocket.on("order_closed", function (d: unknown) {
          console.log("order_closed", JSON.stringify(d));
          callback("order_opened");
        });
        // 监听订单已修改（止盈止损）
        this.mainSocket.on("order_modified", function (d: unknown) {
          console.log("order_modified", JSON.stringify(d));
          callback("order_modified");
        });
        // 监听挂单已创建
        this.mainSocket.on("pending_order_opened", function (d: unknown) {
          console.log("pending_order_opened", JSON.stringify(d));
          callback("pending_order_opened");
        });
        // 监听挂单已删除
        this.mainSocket.on("pending_order_deleted", function (d: unknown) {
          console.log("pending_order_deleted", JSON.stringify(d));
          callback("pending_order_deleted");
        });
        // 监听挂单已更新
        this.mainSocket.on("pending_order_modified", function (d: unknown) {
          console.log("pending_order_modified", JSON.stringify(d));
          callback("pending_order_modified");
        });
        // 监听挂单已成交
        this.mainSocket.on("pending_order_dealt", function (d: unknown) {
          console.log("pending_order_dealt", JSON.stringify(d));
          callback("pending_order_dealt");
        });
        // 监听出入金
        this.mainSocket.on("balance_order_added", function (d: unknown) {
          console.log("balance_order_added", JSON.stringify(d));
          callback("balance_order_added");
        });
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "orderChanges",
          options: callback,
        });
      }
    },

    // 发送市场深度监听
    emitQuoteDepth(symbols: string[]) {
      const userStore = useUser();
      if (this.mainSocket) {
        const depthData = {
          server: userStore.account.server,
          symbols,
        };
        this.mainSocket.emit("subscribe_quote_depth", {
          action: "subscribe_quote_depth",
          d: this.enData({
            ...this.reqData(),
            ...depthData,
          }),
        });
        this.mainSocketEmitList.push({
          action: "subscribe_quote_depth",
          data: depthData,
        });
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "emitQuoteDepth",
          options: symbols,
        });
      }
    },

    // 市场深度返回监听
    subQuoteDepth(callback: (symbol: string, quotes: IQuote[]) => void) {
      if (this.mainSocket) {
        this.mainSocket.on("quote_depth", (d: any) => {
          callback(d.symbol, d.quotes);
        });
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "subQuoteDepth",
          options: callback,
        });
      }
    },

    //取消订阅市场深度
    unSubQuoteDepth(symbols: string[]) {
      if (this.mainSocket) {
        const userStore = useUser();
        const depthData = {
          server: userStore.account.server,
          symbols,
        };
        this.mainSocket.emit("unsubscribe_quote_depth", {
          action: "unsubscribe_quote_depth",
          d: this.enData({
            ...this.reqData(),
            ...depthData,
          }),
        });
        this.mainSocketEmitList.push({
          action: "unsubscribe_quote_depth",
          data: depthData,
        });
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "unSubQuoteDepth",
        });
      }
    },

    // 订阅汇率
    emitRate() {
      if (this.mainSocket) {
        const userStore = useUser();
        this.mainSocket.emit("subscribe_rate", {
          action: "subscribe_rate",
          d: this.enData({
            ...this.reqData(),
            server: userStore.account.server,
          }),
        });
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "emitRate",
        });
      }
    },

    subRate(callback: (e: IRate) => void) {
      if (this.mainSocket) {
        this.mainSocket.on("rate", (d) => {
          callback(d);
        });
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "subRate",
          options: callback,
        });
      }
    },

    //取消订阅汇率
    unSubRate() {
      if (this.mainSocket) {
        const userStore = useUser();
        this.mainSocket.emit("unsubscribe_rate", {
          action: "unsubscribe_rate",
          d: this.enData({
            ...this.reqData(),
            server: userStore.account.server,
          }),
        });
      } else {
        this.mainSocketNoExecuteList.push({
          fooName: "unSubRate",
        });
      }
    },

    // socket意外断开未执行的发送任务重发
    reEmit() {
      setTimeout(() => {
        if (this.mainSocket) {
          while (this.mainSocketEmitList.length) {
            const item = this.mainSocketEmitList.shift();
            if (item) {
              this.mainSocket.emit(item.action, {
                action: item.action,
                d: this.enData({
                  ...this.reqData(),
                  ...item.data,
                }),
              });
            }
          }
        }
      }, 1000);
    },

    closeMainSocket() {
      if (this.mainSocket) {
        this.mainSocket.close();
      }
      if (this.mainInstance) {
        this.mainInstance.close();
      }
      this.mainSocket = null;
    },

    // online socket连接
    async onlineSocketInit() {
      const uri = import.meta.env.VITE_ONLINE_STATISTICS_SOCKET;
      const query = await this.getUriQuery("online", {});
      this.onLineSocket = this.onLineInstance.getInstance(uri, query);
      while (this.onLineSocketNoExecuteList.length) {
        const item = this.onLineSocketNoExecuteList.shift();
        if (item) {
          this[item.fooName](item.options);
        }
      }
    },

    // 埋点用户在线
    async sendOnlineToken() {
      if (this.onLineSocket) {
        const userStore = useUser();
        const d = this.enData({
          ...this.reqData(),
          server: userStore.account.server,
          login: userStore.account.login,
          token: userStore.account.token,
        });
        this.onLineSocket.emit("set_online_login", {
          action: "set_online_login",
          d,
        });
      } else {
        this.onLineSocketNoExecuteList.push({
          fooName: "sendOnlineToken",
        });
      }
    },

    emitQrcodeInit() {
      if (this.onLineSocket) {
        const info = {
          pc_device_id: useSystem().systemInfo!.deviceId,
          pc_device_model: useSystem().systemInfo!.deviceModel,
          pc_device_brand: useSystem().systemInfo!.deviceBrand,
          pc_device_info: useSystem().systemInfo!.deviceInfo,
          pc_ip: useSystem().systemInfo!.localIp,
          req_id: generateUUID(),
          req_time: Date.now(),
        };
        const data = {
          action: "qrcode_init",
          d: encrypt(JSON.stringify(info)),
        };
        this.onLineSocket.emit("qrcode_init", data);
      } else {
        this.onLineSocketNoExecuteList.push({
          fooName: "emitQrcodeInit",
        });
      }
    },

    subQrcodeInit(callback: (params: any) => void) {
      if (this.onLineSocket) {
        this.onLineSocket.on("qrcode_init", (d) => {
          callback(d);
        });
      } else {
        this.onLineSocketNoExecuteList.push({
          fooName: "subQrcodeInit",
          options: callback,
        });
      }
    },

    subQrcodeLogin(callback: (params: any) => void) {
      if (this.onLineSocket) {
        this.onLineSocket.on("qr_code_login", (d) => {
          callback(d);
        });
      } else {
        this.onLineSocketNoExecuteList.push({
          fooName: "subQrcodeLogin",
          options: callback,
        });
      }
    },

    $reset() {
      this.mainSocketNoExecuteList = [];
      this.mainSocketEmitList = [];
      this.closeMainSocket();
    },
  },
});
