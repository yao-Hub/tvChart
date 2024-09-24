import { defineStore } from "pinia";
import SingletonSocket from "utils/socket";
import { useNetwork } from "@/store/modules/network";
import { useChartSub } from "@/store/modules/chartSub";
import { useUser } from "@/store/modules/user";

interface State {
  socket: any;
  delayMap: Record<string, string | number>;
  instance: any
}
interface ChartProps {
  resolution: string | number;
  symbol: string;
}
export const useSocket = defineStore("socket", {
  state: (): State => ({
    instance: null,
    socket: null,
    delayMap: {}
  }),

  actions: {
    initSocket() {
      const networkStore = useNetwork();
      const mainUri = networkStore.currentNode?.webWebsocket;
      if (mainUri) {
        const wsUriList = networkStore.nodeList.map(item => item.webWebsocket);
        this.instance = new SingletonSocket();
        this.socket = this.instance.getInstance(mainUri);
        setTimeout(() => {
          this.instance.getSocketDelay(wsUriList);
        }, 1000)
        // this.pollingDelay(wsUriList);
      }
    },

    subscribeSocket({ resolution, symbol }: ChartProps) {
      const userStore = useUser();
      this.socket?.emit("subscribe_kline", {
        server: userStore.account.server,
        symbol_period_type: [
          {
            symbol,
            period_type: resolution,
          },
        ],
      });

      this.socket?.emit("subscribe_quote", {
        server: userStore.account.server,
        symbols: [symbol],
      });
    },

    // 取消订阅k线和报价
    unsubscribeSocket({ resolution, symbol }: ChartProps) {
      const subStore = useChartSub();
      const userStore = useUser();

      const list = subStore.mustSubscribeList;
      if (list.indexOf(symbol) > -1) {
        console.warn(`${symbol}品种需要持续监听，无法取消监听`);
        return;
      }
      this.socket?.emit("unsubscribe_kline", {
        server: userStore.account.server,
        symbol_period_type: [
          {
            symbol,
            period_type: resolution,
          },
        ],
      });
      this.socket?.emit("unsubscribe_qoute", {
        server: userStore.account.server,
        symbol_period_type: [symbol],
      });
    },

    // 验证登录信息绑定交易账户
    sendToken(login: number | string, token: string) {
      const userStore = useUser();
      this.socket?.emit("set_login", {
        server: userStore.account.server,
        login,
        token,
      });
    },

    orderChanges(callback: Function) {
      // 监听订单已建仓
      this.socket?.on("order_opened", function (d: any) {
        console.log("order_opened", JSON.stringify(d));
        callback("order_opened");
      });
      // 监听订单已平仓
      this.socket?.on("order_closed", function (d: any) {
        console.log("order_closed", JSON.stringify(d));
        callback("order_opened");
      });
      // 监听订单已修改（止盈止损）
      this.socket?.on("order_modified", function (d: any) {
        console.log("order_modified", JSON.stringify(d));
        callback("order_modified");
      });
      // 监听挂单已创建
      this.socket?.on("pending_order_opened", function (d: any) {
        console.log("pending_order_opened", JSON.stringify(d));
        callback("pending_order_opened");
      });
      // 监听挂单已删除
      this.socket?.on("pending_order_deleted", function (d: any) {
        console.log("pending_order_deleted", JSON.stringify(d));
        callback("pending_order_deleted");
      });
      // 监听挂单已更新
      this.socket?.on("pending_order_modified", function (d: any) {
        console.log("pending_order_modified", JSON.stringify(d));
        callback("pending_order_modified");
      });
      // 监听挂单已成交
      this.socket?.on("pending_order_dealt", function (d: any) {
        console.log("pending_order_dealt", JSON.stringify(d));
        callback("pending_order_dealt");
      });
      // 监听出入金
      this.socket?.on("balance_order_added", function (d: any) {
        console.log("balance_order_added", JSON.stringify(d));
        callback("balance_order_added");
      });
    },

    pollingDelay(uriList: string[]) {
      const pollingInterval = 30 * 1000;
      if (this.instance) {
        setInterval(() => {
          this.instance.getSocketDelay(uriList);
        }, pollingInterval);
      }
    }
  },
});
