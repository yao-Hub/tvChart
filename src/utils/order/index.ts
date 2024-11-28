import { ORDER_TYPE, ORDERMAP } from "@/constants/common";
import { findKey } from "lodash";

type TOrderType = keyof typeof ORDER_TYPE; // 'price' | 'limit' | 'stop' | 'stopLimit'
type TActionType = "buy" | "sell";

// 获取交易方向 buy or sell
export const getTradingDirection = (e: string | number) => {
  let type: TOrderType;
  let action: TActionType;
  for (type in ORDER_TYPE) {
    for (action in ORDER_TYPE[type]) {
      if (ORDER_TYPE[type][action] === +e) {
        return action;
      }
    }
  }
  return "";
};

// 获取订单类型
export const getOrderType = (e: number) => {
  return findKey(ORDERMAP, (o) => o === e);
};
