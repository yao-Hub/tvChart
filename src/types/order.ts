import { resOrders } from "api/order/index";

export type TableTabKey =
  | "marketOrder"
  | "pendingOrder"
  | "pendingOrderHistory"
  | "marketOrderHistory"
  | "blanceRecord"
  | "log";
export type TableData = {
  [K in TableTabKey]: resOrders[];
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
