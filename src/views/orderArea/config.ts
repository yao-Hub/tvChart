import { resOrders, resPendingOrders, resHistoryOrders } from 'api/order/index';

export const tableColumns = {
  'position': [
    {
      title: '创建时间 (UTC+8)',
      dataIndex: 'time_setup',
      key: 'time_setup',
      width: 200,
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
      title: '提交时间（UTC+8）',
      dataIndex: 'time_setup',
      key: 'time_setup',
      width: 200,
      sorter: (a: resPendingOrders, b: resPendingOrders) => a.time_setup - b.time_setup
    },
    {
      title: '交易品种',
      dataIndex: 'symbol',
      key: 'symbol',
      sorter: (a: resPendingOrders, b: resPendingOrders) => a.symbol.localeCompare(b.symbol)
    },
    {
      title: '方向',
      dataIndex: 'type',
      key: 'type',
      sorter: (a: resPendingOrders, b: resPendingOrders) => a.type - b.type
    },
    { title: '订单类型', dataIndex: 'orderType', key: 'orderType'},
    { title: '当前数量', dataIndex: 'volume', key: 'volume' },
    { title: '触发价位', dataIndex: 'order_price', key: 'order_price' },
    { title: '现价', dataIndex: 'now_price', key: 'now_price' },
    { title: '距离', dataIndex: 'distance', key: 'distance' },
    { title: '止盈', dataIndex: 'tp_price', key: 'tp_price' },
    { title: '止损', dataIndex: 'sl_price', key: 'sl_price' },
    {
      title: '过期时间',
      dataIndex: 'time_expiration',
      key: 'time_expiration',
      width: 200,
      sorter: (a: resPendingOrders, b: resPendingOrders) => a.time_setup - b.time_setup
    },
    { title: '操作', dataIndex: 'orderAction', key: 'orderAction' },
  ],
  'transactionHistory': [
    {
      title: '建仓时间（UTC+8）',
      dataIndex: 'time_setup',
      key: 'open_time',
      width: 200,
      sorter: (a: resHistoryOrders, b: resHistoryOrders) => a.open_time - b.open_time
    },
    {
      title: '交易品种',
      dataIndex: 'symbol',
      key: 'symbol',
      sorter: (a: resHistoryOrders, b: resHistoryOrders) => a.symbol.localeCompare(b.symbol)
    },
    {
      title: '开仓方向',
      dataIndex: 'type',
      key: 'type',
      sorter: (a: resHistoryOrders, b: resHistoryOrders) => a.type - b.type
    },
    {
      title: '结束时间（UTC+8）',
      dataIndex: 'time_done',
      key: 'time_done',
      width: 200,
      sorter: (a: resPendingOrders, b: resPendingOrders) => a.time_done - b.time_done
    },
    {
      title: '建仓价格',
      dataIndex: 'open_price',
      key: 'open_price',
      sorter: (a: resHistoryOrders, b: resHistoryOrders) => a.open_price - b.open_price
    },
    {
      title: '平仓价',
      dataIndex: 'close_price',
      key: 'close_price',
      sorter: (a: resHistoryOrders, b: resHistoryOrders) => a.close_price - b.close_price
    },
    { title: '数量', dataIndex: 'volume', key: 'volume' },
    {
      title: '净 EUR',
      dataIndex: 'profit',
      key: 'profit',
      sorter: (a: resHistoryOrders, b: resHistoryOrders) => a.profit - b.profit
    },
  ]
}
