import { resOrders, resPendingOrders, resHistoryOrders } from "api/order/index";

export const tableColumns: any = {
  position: [
    {
      title: "交易品种",
      dataIndex: "symbol",
      key: "symbol",
      width: 120,
      sorter: (a: resOrders, b: resOrders) => a.symbol.localeCompare(b.symbol),
    },
    { title: "订单ID", dataIndex: "id", key: "id", width: 100 },
    {
      title: "方向",
      dataIndex: "type",
      key: "type",
      width: 100,
      sorter: (a: resOrders, b: resOrders) => a.type - b.type,
    },
    {
      title: "建仓时间 (UTC+8)",
      dataIndex: "time_setup",
      key: "time_setup",
      width: 200,
      sorter: (a: resOrders, b: resOrders) => a.time_setup - b.time_setup,
    },
    { title: "手数", dataIndex: "volume", key: "volume", width: 100 },
    // {
    //   title: "合约数量",
    //   dataIndex: "contract_size",
    //   key: "contract_size",
    //   width: 100,
    // },
    { title: "止盈", dataIndex: "tp_price", key: "tp_price", width: 110 },
    { title: "止损", dataIndex: "sl_price", key: "sl_price", width: 110 },
    { title: "入场价", dataIndex: "open_price", key: "open_price", width: 110 },
    { title: "当前价", dataIndex: "now_price", key: "now_price", width: 110 },
    {
      title: "盈亏",
      dataIndex: "profit",
      key: "profit",
      width: 110,
      sorter: (a: resOrders, b: resOrders) => a.profit - b.profit,
    },
    { title: "过夜费", dataIndex: "storage", key: "storage", width: 110 },
    { title: "手续费", dataIndex: "fee", key: "fee", width: 110 },
    { title: "持仓天数", dataIndex: "days", key: "days", width: 110 },
    {
      title: "",
      dataIndex: "positionAction",
      key: "positionAction",
      fixed: "right",
      width: 100,
      align: "right"
    },
  ],
  order: [
    {
      title: "交易品种",
      dataIndex: "symbol",
      key: "symbol",
      width: 120,
      sorter: (a: resPendingOrders, b: resPendingOrders) =>
        a.symbol.localeCompare(b.symbol),
    },
    { title: "订单ID", dataIndex: "id", key: "id", width: 100 },
    { title: "订单类型", dataIndex: "orderType", key: "orderType", width: 110 },
    {
      title: "建仓时间（UTC+8）",
      dataIndex: "time_setup",
      key: "time_setup",
      width: 200,
      sorter: (a: resPendingOrders, b: resPendingOrders) =>
        a.time_setup - b.time_setup,
    },
    // {
    //   title: "方向",
    //   dataIndex: "type",
    //   key: "type",
    //   width: 100,
    //   sorter: (a: resPendingOrders, b: resPendingOrders) => a.type - b.type,
    // },
    { title: "手数", dataIndex: "volume", key: "volume", width: 110 },
    {
      title: "挂单价格",
      dataIndex: "order_price",
      key: "order_price",
      width: 110,
    },
    // {
    //   title: "限制价位",
    //   dataIndex: "trigger_price",
    //   key: "trigger_price",
    //   width: 110,
    // },
    { title: "当前价格", dataIndex: "now_price", key: "now_price", width: 100 },
    // { title: "距离", dataIndex: "distance", key: "distance", width: 100 },
    { title: "止盈", dataIndex: "tp_price", key: "tp_price", width: 100 },
    { title: "止损", dataIndex: "sl_price", key: "sl_price", width: 100 },
    {
      title: "到期时间",
      dataIndex: "time_expiration",
      key: "time_expiration",
      width: 200,
      sorter: (a: resPendingOrders, b: resPendingOrders) =>
        a.time_setup - b.time_setup,
    },
    {
      title: "",
      dataIndex: "orderAction",
      key: "orderAction",
      fixed: "right",
      width: 100,
      align: "right"
    },
  ],
  // 历史挂单
  orderHistory: [
    { title: "订单ID", dataIndex: "id", key: "id", width: 100 },
    {
      title: "交易品种",
      dataIndex: "symbol",
      key: "symbol",
      width: 120,
      sorter: (a: resPendingOrders, b: resPendingOrders) =>
        a.symbol.localeCompare(b.symbol),
    },
    { title: "订单类型", dataIndex: "orderType", key: "orderType", width: 110 },
    {
      title: "挂单时间（UTC+8）",
      dataIndex: "time_setup",
      key: "time_setup",
      width: 200,
      sorter: (a: resPendingOrders, b: resPendingOrders) =>
        a.time_setup - b.time_setup,
    },
    { title: "手数", dataIndex: "volume", key: "volume", width: 100 },
    {
      title: "挂单价格",
      dataIndex: "order_price",
      key: "order_price",
      width: 110,
    },
    // {
    //   title: "方向",
    //   dataIndex: "type",
    //   key: "type",
    //   width: 100,
    //   sorter: (a: resPendingOrders, b: resPendingOrders) => a.type - b.type,
    // },
    // {
    //   title: "限制价位",
    //   dataIndex: "trigger_price",
    //   key: "trigger_price",
    //   width: 110,
    // },
    { title: "止盈", dataIndex: "tp_price", key: "tp_price", width: 100 },
    { title: "止损", dataIndex: "sl_price", key: "sl_price", width: 100 },
    {
      title: "到期时间",
      dataIndex: "time_expiration",
      key: "time_expiration",
      width: 200,
      sorter: (a: resPendingOrders, b: resPendingOrders) =>
        a.time_setup - b.time_setup,
    },
    {
      title: "关闭时间",
      dataIndex: "time_done",
      key: "time_done",
      width: 200,
      sorter: (a: resPendingOrders, b: resPendingOrders) =>
        a.time_done - b.time_done,
    },
  ],
  // 历史持仓
  transactionHistory: [
    { title: "订单ID", dataIndex: "id", key: "id", fixed: "left", width: 100 },
    {
      title: "交易品种",
      dataIndex: "symbol",
      key: "symbol",
      sorter: (a: resHistoryOrders, b: resHistoryOrders) =>
        a.symbol.localeCompare(b.symbol),
      width: 120,
    },
    {
      title: "方向",
      dataIndex: "type",
      key: "type",
      width: 80,
      sorter: (a: resHistoryOrders, b: resHistoryOrders) => a.type - b.type,
    },
    {
      title: "建仓时间（UTC+8）",
      dataIndex: "time_setup",
      key: "open_time",
      width: 200,
      sorter: (a: resHistoryOrders, b: resHistoryOrders) =>
        a.open_time - b.open_time,
    },
    {
      title: "入场价",
      dataIndex: "open_price",
      key: "open_price",
      width: 110,
      sorter: (a: resHistoryOrders, b: resHistoryOrders) =>
        a.open_price - b.open_price,
    },
    { title: "手数", dataIndex: "volume", key: "volume", width: 80 },
    { title: "止盈", dataIndex: "tp_price", key: "tp_price", width: 100 },
    { title: "止损", dataIndex: "sl_price", key: "sl_price", width: 100 },
    { title: "平仓ID", dataIndex: "from_id", key: "from_id", width: 130 },
    {
      title: "平仓价",
      dataIndex: "close_price",
      key: "close_price",
      width: 110,
      sorter: (a: resHistoryOrders, b: resHistoryOrders) =>
        a.close_price - b.close_price,
    },
    {
      title: "平仓类型",
      dataIndex: "close_type",
      key: "close_type",
      width: 80,
    },
    {
      title: "盈亏",
      dataIndex: "profit",
      key: "profit",
      width: 110,
      sorter: (a: resHistoryOrders, b: resHistoryOrders) => a.profit - b.profit,
    },
    // {
    //   title: "最初的建仓订单",
    //   dataIndex: "position_id",
    //   key: "position_id",
    //   width: 130,
    // },
    // {
    //   title: "结束时间（UTC+8）",
    //   dataIndex: "time_done",
    //   key: "time_done",
    //   width: 200,
    //   sorter: (a: resPendingOrders, b: resPendingOrders) =>
    //     a.time_done - b.time_done,
    // },
    { title: "过夜费", dataIndex: "storage", key: "storage", width: 100 },
    { title: "手续费", dataIndex: "fee", key: "fee", width: 100 },
    { title: "持仓天数", dataIndex: "days", key: "days", width: 80 },
    // { title: "备注", dataIndex: "comment", key: "comment", width: 100 },
  ],
};
