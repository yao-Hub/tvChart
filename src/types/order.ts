import { resOrders } from "api/order/index";

export type TableDataKey =
  | "marketOrder"
  | "pendingOrder"
  | "pendingOrderHistory"
  | "marketOrderHistory"
  | "blanceRecord"
  | "log";
export type TableData = {
  [K in TableDataKey]: resOrders[];
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
