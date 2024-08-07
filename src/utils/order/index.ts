import { ORDER_TYPE } from "@/constants/common";
import { findKey } from "lodash";
import { OrderType } from "@/types/chart/index";

// 获取交易方向 buy or sell
export const getTradingDirection = (e: string | number) => {
  for (let type in ORDER_TYPE) {
    for (let action in ORDER_TYPE[type]) {
      // @ts-ignore
      if (ORDER_TYPE[type][action] === +e) {
        return action;
      }
    }
  }
  return '';
};

// 获取订单类型
export const getOrderType = (e: number) => {
  return findKey(ORDER_TYPE, (o) => o.buy === e || o.sell === e) as OrderType;
};
