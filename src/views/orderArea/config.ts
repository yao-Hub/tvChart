import { resOrders, resPendingOrders } from 'api/order/index';

export const tableColumns = {
  'position': [
    {
      title: '创建时间 (UTC+8)',
      dataIndex: 'time_setup',
      key: 'time_setup',
      sorter: (a: resOrders, b: resOrders) => a.time_setup - b.time_setup
    },
    {
      title: '交易品种',
      dataIndex: 'symbol',
      key: 'symbol',
      sorter: (a: resOrders, b: resOrders) => a.symbol.localeCompare(b.symbol)
    },
    { title: '数量', dataIndex: 'volume', key: 'volume' },
    {
      title: '方向',
      dataIndex: 'type',
      key: 'type',
      sorter: (a: resOrders, b: resOrders) => a.type - b.type
    },
    { title: '入场', dataIndex: 'open_price', key: 'open_price' },
    { title: '现价', dataIndex: 'now_price', key: 'now_price', width: 150 },
    { title: '止盈', dataIndex: 'tp_price', key: 'tp_price' },
    { title: '止损', dataIndex: 'sl_price', key: 'sl_price' },
    {
      title: '净 EUR',
      dataIndex: 'profit',
      key: 'profit',
      sorter: (a: resOrders, b: resOrders) => a.profit - b.profit
    },
    { title: '操作', dataIndex: 'positionAction', key: 'positionAction' },
  ],
  'order': [
    {
      title: '交易品种',
      dataIndex: 'symbol',
      key: 'symbol',
      sorter: (a: resPendingOrders, b: resPendingOrders) => a.symbol.localeCompare(b.symbol)
    },
    { title: '方向', dataIndex: 'type', key: 'type' },
    {
      title: '提交时间（UTC+8）',
      dataIndex: 'time_setup',
      key: 'time_setup',
      sorter: (a: resPendingOrders, b: resPendingOrders) => a.time_setup - b.time_setup
    },
    { title: '订单类型', dataIndex: 'orderType', key: 'orderType'},
    { title: '当前数量', dataIndex: 'volume', key: 'volume' },
    { title: '触发价位', dataIndex: 'order_price', key: 'order_price' },
    { title: '现价', dataIndex: 'now_price', key: 'now_price', width: 150 },
    { title: '距离', dataIndex: 'distance', key: 'distance' },
    { title: '止盈', dataIndex: 'tp_price', key: 'tp_price' },
    { title: '止损', dataIndex: 'sl_price', key: 'sl_price' },
    { title: '过期时间', dataIndex: 'time_expiration', key: 'time_expiration' },
    { title: '操作', dataIndex: 'orderAction', key: 'orderAction' },
  ],
  'transactionHistory': []
}
