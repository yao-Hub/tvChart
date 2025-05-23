import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import zhTw from "element-plus/es/locale/lang/zh-tw";

export const LANGUAGE_LIST = {
  zh: zhCn,
  en,
  zhTw,
};

// 股票交易方向
export const STOCKS_DIRECTION = {
  0: "buy",
  1: "sell",
};
export const ORDER_TYPE: Record<string, { buy: number; sell: number }> = {
  price: {
    buy: 0,
    sell: 1,
  },
  limit: {
    buy: 2,
    sell: 3,
  },
  stop: {
    buy: 4,
    sell: 5,
  },
  stopLimit: {
    buy: 6,
    sell: 7,
  },
};

export const ORDERMAP = {
  buyLimit: 2,
  sellLimit: 3,
  buyStop: 4,
  sellStop: 5,
  buyStopLimit: 6,
  sellStopLimit: 7,
} as Record<string, number>;

export const CLOSE_TYPE: Record<number, string> = {
  0: "manual", // 手动
  1: "sl", // 止盈
  2: "tp", // 止损
  3: "forcedLiquidation", // 强平(预付款不足)
  4: "reverseBuilding", // 反向建仓
};

export const RESOLUTES: Record<string, string> = {
  "1D": "1 days",
  "1W": "1 weeks",
  "1M": "1 months",
  "60": "1 hours",
  "240": "4 hours",
  "1": "1 minutes",
  "5": "5 minutes",
  "15": "15 minutes",
  "30": "30 minutes",
} as const;
