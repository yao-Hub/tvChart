import { resOrders } from "api/order/index";

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
  [K in TableTabKey]: K extends "log" ? ILog[] : resOrders[];
};

export type OrderType =
  | "price"
  | "buyLimit"
  | "sellLimit"
  | "buyStop"
  | "sellStop"
  | "buyStopLimit"
  | "sellStopLimit";

export type DirectionType = "buy" | "sell";
