import { defineStore } from "pinia";
import SingletonSocket from "utils/socket";
import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";

interface IQuote {
  ask: number;
  ask_size: number;
  bid: number;
  bid_size: number;
}

interface State {
  socket: any;
  delayMap: Record<string, string | number>;
  instance: any;
  noExecuteList: Array<{
    fooName:
      | "subKlineQuote"
      | "unsubKlineQuote"
      | "sendToken"
      | "subQuoteDepth"
      | "orderChanges"
      | "getQuoteDepth";
    options?: any;
  }>;
  depthMap: Record<string, IQuote[]>;
}
interface ChartProps {
  resolution: string | number;
  symbol: string;
}
export const useSocket = defineStore("socket", {
  state: (): State => ({
    instance: null,
    socket: null,
    delayMap: {},
    noExecuteList: [],
    depthMap: {},
  }),

  actions: {
    initSocket() {
      const networkStore = useNetwork();
      const mainUri = networkStore.currentNode?.webWebsocket;
      if (mainUri) {
        this.instance = new SingletonSocket();
        this.socket = this.instance.getInstance(mainUri);

        this.noExecuteList.forEach((item) => {
          this[item.fooName](item.options);
        });
        this.noExecuteList = [];

        setTimeout(() => {
          this.getDelay();
        }, 1000);
      }
    },

    // 订阅k线和报价
    subKlineQuote({ resolution, symbol }: ChartProps) {
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
          fooName: "subKlineQuote",
          options: { resolution, symbol },
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
    sendToken({ login, token }: any) {
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

    orderChanges(callback: Function) {
      if (this.socket) {
        // 监听订单已建仓
        this.socket.on("order_opened", function (d: any) {
          console.log("order_opened", JSON.stringify(d));
          callback("order_opened");
        });
        // 监听订单已平仓
        this.socket.on("order_closed", function (d: any) {
          console.log("order_closed", JSON.stringify(d));
          callback("order_opened");
        });
        // 监听订单已修改（止盈止损）
        this.socket.on("order_modified", function (d: any) {
          console.log("order_modified", JSON.stringify(d));
          callback("order_modified");
        });
        // 监听挂单已创建
        this.socket.on("pending_order_opened", function (d: any) {
          console.log("pending_order_opened", JSON.stringify(d));
          callback("pending_order_opened");
        });
        // 监听挂单已删除
        this.socket.on("pending_order_deleted", function (d: any) {
          console.log("pending_order_deleted", JSON.stringify(d));
          callback("pending_order_deleted");
        });
        // 监听挂单已更新
        this.socket.on("pending_order_modified", function (d: any) {
          console.log("pending_order_modified", JSON.stringify(d));
          callback("pending_order_modified");
        });
        // 监听挂单已成交
        this.socket.on("pending_order_dealt", function (d: any) {
          console.log("pending_order_dealt", JSON.stringify(d));
          callback("pending_order_dealt");
        });
        // 监听出入金
        this.socket.on("balance_order_added", function (d: any) {
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

    // 市场深度
    subQuoteDepth(symbols: string[]) {
      const userStore = useUser();
      if (this.socket) {
        this.socket.emit("subscribe_quote_depth", {
          server: userStore.account.server,
          symbols,
        });
      } else {
        this.noExecuteList.push({
          fooName: "subQuoteDepth",
          options: symbols,
        });
      }
    },

    getQuoteDepth() {
      if (this.socket) {
        this.socket.on("quote_depth", (d: any) => {
          this.depthMap[d.symbol] = d.quotes;
        });
      } else {
        this.noExecuteList.push({
          fooName: "getQuoteDepth",
        });
      }
    },

    // 获取socket延迟
    getDelay(callback?: Function) {
      const networkStore = useNetwork();
      const wsUriList = networkStore.nodeList.map((item) => item.webWebsocket);
      this.instance.getSocketDelay(wsUriList, (e: any) => {
        if (callback) {
          callback(e);
        }
      });
    },

    // 轮询获取延迟
    pollingDelay(uriList: string[]) {
      const pollingInterval = 30 * 1000;
      if (this.instance) {
        setInterval(() => {
          this.instance.getSocketDelay(uriList);
        }, pollingInterval);
      }
    },
  },
});
