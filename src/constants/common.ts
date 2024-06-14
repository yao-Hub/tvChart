import enUS from 'ant-design-vue/es/locale/en_US';
import zhCN from 'ant-design-vue/es/locale/zh_CN';

export const LANGUAGE_LIST = {
  "zh": zhCN,
  "en": enUS,
} as const

// 单选语言切换
export const LOCALE_SINGLE_LIST = {
  "zh": '中',
  "en": 'En',
} as const

// 图标按钮权重
export const TOOLBAR_BTN_ORDER = {
  Avatar: '-3',
  AddOrder: '-2',
  AddOrderSeparator: '-1',
}

// 股票交易方向
export const STOCKS_DIRECTION = {
  buy: 0,
  sell: 1
}
