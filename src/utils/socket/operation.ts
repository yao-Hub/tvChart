import SingletonSocket from "utils/socket";
import { useChartSub } from "@/store/modules/chartSub";

export const socket = SingletonSocket.getInstance(
  import.meta.env.VITE_WEB_SOCKET_URL
);

interface ChartProps {
  resolution: string | number;
  symbol: string;
}

// 订阅k线和报价
export const subscribeSocket = ({ resolution, symbol }: ChartProps) => {
  socket.emit("subscribe_kline", {
    server: "upway-live",
    symbol_period_type: [
      {
        symbol,
        period_type: resolution,
      },
    ],
  });

  socket.emit("subscribe_qoute", {
    server: "upway-live",
    symbols: [symbol],
  });
};

// 取消订阅k线和报价
export const unsubscribeSocket = ({ resolution, symbol }: ChartProps) => {
  const subStore = useChartSub();

  const list = subStore.mustSubscribeList;
  if (list.indexOf(symbol) > -1) {
    console.warn(`${symbol}品种需要持续监听，无法取消监听`);
    return;
  }
  socket.emit("unsubscribe_kline", {
    server: "upway-live",
    symbol_period_type: [
      {
        symbol,
        period_type: resolution,
      },
    ],
  });
  socket.emit("unsubscribe_qoute", {
    server: "upway-live",
    symbol_period_type: [symbol],
  });
};

// 验证登录信息绑定交易账户
export const sendToken = (login: string, token: string) => {
  socket.emit("set_login", {
    server: "upway-live",
    login,
    token,
  });
};

export const orderChanges = (callback: Function) => {
  // 监听订单已建仓
  socket.on("order_opened", function (d) {
    console.log("order_opened", JSON.stringify(d));
    callback("order_opened");
  });
  // 监听订单已平仓
  socket.on("order_closed", function (d) {
    console.log("order_closed", JSON.stringify(d));
    callback("order_opened");
  });
  // 监听订单已修改（止盈止损）
  socket.on("order_modified", function (d) {
    console.log("order_modified", JSON.stringify(d));
    callback("order_modified");
  });
  // 监听挂单已创建
  socket.on("pending_order_opened", function (d) {
    console.log("pending_order_opened", JSON.stringify(d));
    callback("pending_order_opened");
  });
  // 监听挂单已删除
  socket.on("pending_order_deleted", function (d) {
    console.log("pending_order_deleted", JSON.stringify(d));
    callback("pending_order_deleted");
  });
  // 监听挂单已更新
  socket.on("pending_order_modified", function (d) {
    console.log("pending_order_modified", JSON.stringify(d));
    callback("pending_order_modified");
  });
  // 监听挂单已成交
  socket.on("pending_order_dealt", function (d) {
    console.log("pending_order_dealt", JSON.stringify(d));
    callback("pending_order_dealt");
  });
  // 监听出入金
  socket.on("balance_order_added", function (d) {
    console.log("balance_order_added", JSON.stringify(d));
    callback("balance_order_added");
  });
};
