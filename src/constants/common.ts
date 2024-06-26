import enUS from 'ant-design-vue/es/locale/en_US';
import zhCN from 'ant-design-vue/es/locale/zh_CN';

export const LANGUAGE_LIST = {
  "zh": zhCN,
  "en": enUS,
}

// 单选语言切换
export const LOCALE_SINGLE_LIST = {
  "zh": '中',
  "en": 'En',
}

// 单选语言切换
export const LOCALE_LIST = {
  "zh": 'zh-cn',
  "en": 'en',
}

// 图标按钮权重
export const TOOLBAR_BTN_ORDER = {
  Avatar: '-3',
  AddOrder: '-2',
  AddOrderSeparator: '-1',
}

// 股票交易方向
export const STOCKS_DIRECTION = {
  0: 'buy',
  1: 'sell'
}

export const BUY_SELL_TYPE = {
  price: {
    buy: 0,
    sell: 1
  },
  limit: {
    buy: 2,
    sell: 3
  },
  stop: {
    buy: 4,
    sell: 5
  },
  stopLimit : {
    buy: 6,
    sell: 7
  },
}
