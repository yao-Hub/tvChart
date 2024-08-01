import enUS from "ant-design-vue/es/locale/en_US";
import zhCN from "ant-design-vue/es/locale/zh_CN";

export const LANGUAGE_LIST = {
  zh: zhCN,
  en: enUS,
};

// 单选语言切换
export const LOCALE_SINGLE_LIST = {
  zh: "中",
  en: "En",
};

// 单选语言切换
export const LOCALE_LIST = {
  zh: "zh-cn",
  en: "en",
};

// 图标按钮权重
export const TOOLBAR_BTN_ORDER = {
  Avatar: "-3",
  AddOrder: "-2",
  AddOrderSeparator: "-1",
};

// 股票交易方向
export const STOCKS_DIRECTION = {
  0: "buy",
  1: "sell",
};
interface OrderType {
  [value: string]: { buy: number; sell: number };
}
export const ORDER_TYPE: OrderType = {
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
} as const;

export const CLOSE_TYPE: Record<number, string> = {
  0: "手动",
  1: "sl",
  2: "tp",
  3: "强平",
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
