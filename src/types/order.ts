import { resOrders, resHistoryOrders, resPendingOrders } from "api/order/index";

export interface ILog {
  id: string;
  origin: string;
  time: string;
  login: string;
  logType: string;
  logName: string;
  detail: string;
}

export type TableTabKey =
  | "marketOrder"
  | "pendingOrder"
  | "pendingOrderHistory"
  | "marketOrderHistory"
  | "blanceRecord"
  | "log";

export type TableData = {
  marketOrder: resOrders[];
  pendingOrder: resPendingOrders[];
  pendingOrderHistory: resPendingOrders[];
  marketOrderHistory: resHistoryOrders[];
  blanceRecord: resHistoryOrders[];
  log: ILog[];
};

export type OrderType =
  | "price"
  | "buyLimit"
  | "sellLimit"
  | "buyStop"
  | "sellStop"
  | "buyStopLimit"
  | "sellStopLimit";
