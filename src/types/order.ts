import { resOrders } from 'api/order/index';

export type TableDataKey = 'position' | 'order' | 'transactionHistory'
export type TableData = {
  [K in TableDataKey]?: resOrders[]
}

export type OrderType = 'price' | 'limit' | 'stop' | 'stopLimit';

export type bsType = 'buy' | 'sell';
