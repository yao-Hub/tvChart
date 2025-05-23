import request from "utils/http";

enum Api {
  MarketOrdersAdd = "/login/market_orders_add",
  OpenningOrders = "/login/openning_orders",
  MarketOrdersAddClose = "/login/market_orders_close",
  PendingOrdersAdd = "/login/pending_orders_add",
  PendingOrders = "/login/get_pending_orders",
  HistoryPendingOrders = "/login/get_history_pending_orders",
  HistoryOrders = "/login/get_history_orders",
  DelPendingOrders = "/login/delete_pending_orders",
  EditPendingOrders = "/login/modify_openning_orders",
  MarketOrdersReverse = "/login/market_orders_reverse",
  MarketOrdersDouble = "/login/market_orders_double",
  MarketOrdersCloseMulti = "/login/market_orders_close_multi",
  ModifyPendingOrders = "/login/modify_pending_orders",
}

export interface ReqOrderAdd {
  symbol: string; // 	商品
  type: number; // 	操作方向。0=buy，1=sell
  volume: number; // 	手数。1=0.01手
  sl?: number; // 	止损价。1=0.01手
  tp?: number; // 	止盈价。1=0.01手
  comment?: string;
}

interface ResOrderAdd {
  symbol: string; // 	商品
  type: number; // 	操作方向。0=buy，1=sell
  volume: number; // 	手数
  sl: number; // 	操作方向。0=buy，1=sell
  tp: number; // 	操作方向。0=buy，1=sell
  comment: string; // 	订单评论备注
  id: string; // 	成功时产生的订单ID
  action_success: boolean; //	是否操作成功
  err_text: string; //	失败原因。需映射成国际化语言
  open_price: number;
  close_price: number;
}

export interface resOrders {
  id: number; // 	订单ID
  time_setup: number; // 	订单创建时间，即记录插入时间。挂单成交后 time_setup 与 open_time 不一样
  symbol: string; // 	订单交易商品
  digits: number; // 	订单交易商品报价小数位数
  currency_digits: number; // 	订单法币小数位数
  contract_size: number; // 	订单商品合约数量
  state: number; // 	预留字段
  reason: string; // 	预留字段
  time_expiration: number; // 	过期时间。挂单创建后有效
  time_done: number; // 	结束时间。订单彻底结束时间。如 持仓平仓、挂单删除
  type: number; // 	做单方向。0=buy,1=sell
  origin_type: number; // 	原始的type值。如挂单 type=2 buy limit 成交后 type 设置为0
  order_price: number; // 	挂单价格
  trigger_price: number; // 	触及价格
  status: number; // 	状态。1=挂单中，2=已建仓，3=已平仓，4=已关闭
  open_price: number; // 	建仓价格
  open_time: number; // 	建仓时间
  from_id: number; // 	源ID。如订单部分平仓时，就订单平仓对应手数并结束，余下手数自动生成新订单
  position_id: number; // 	订单组ID。建仓时为id值。部分平仓时，position_id保持不变
  volume: number; // 	手数
  sl_price: number; // 	止损价
  tp_price: number; // 	止盈价
  close_price: number; // 	平仓价。持仓中唤作“最新价”更合适
  close_time: number; // 	平仓时间
  storage: number; // 	过夜费
  fee: number; // 	手续费
  profit: number | string; // 	浮动盈亏
  comment: string; // 	备注评论
  now_price?: number; // 现价
  pre_currency: string;
}

export interface reqMarketClose {
  symbol: string; //	商品
  id: number; //	订单ID
  volume: number; //	平仓手数。1=0.01手
}

interface resMarketClose {
  symbol: string; //	商品
  id: number; //	订单ID
  volume: number; //	手数
  action_success: boolean; // 是否操作成功
  err_text: string;
  close_price: number;
}

export interface reqPendingOrdersAdd {
  symbol: string; // 	商品
  type: number; // 	挂单类型
  order_price: number; // 	挂单价格。
  trigger_price?: number; // 	回调触及价格。type=6、7 时必填
  volume: number; // 	手数。1=0.01手
  sl?: number; // 	止损价。
  tp?: number; // 	止盈价。
  time_expiration?: number; //	过期时间，秒级
}

interface resPendingOrdersAdd {
  symbol: string; //	商品
  type: number; //	挂单类型
  order_price: number; //	挂单价格。
  trigger_price?: number; //	回调触及价格。type=6、7 时必填
  volume: number; //	手数
  sl: number; //	操作方向。0=buy，1=sell
  tp: number; //	操作方向。0=buy，1=sell
  time_expiration: number; //	过期时间，秒级
  id: string; //	成功时产生的订单ID
  action_success: boolean; //	是否操作成功
  err_text: string; //	失败原因。需映射成国际化语言
}

export interface reqHistoryPendingOrders {
  limit_id?: number; // 	挂单ID < limit_id
  begin_time?: string; // 	挂单创建时间的最小值。YYYY-mm-dd HH:ii:ss
  end_time?: string; // 	挂单创建时间的最大值。YYYY-mm-dd HH:ii:ss
  count?: number; // 	最大200
  symbol?: string; // 	商品
}

export interface resPendingOrders {
  id: number; //	订单ID
  time_setup: number; //	订单创建时间，即记录插入时间。挂单成交后 time_setup 与 open_time 不一样
  symbol: string; //	订单交易商品
  digits: number; //	订单交易商品报价小数位数
  currency_digits: number; //	订单法币小数位数
  contract_size: number; //	订单商品合约数量
  state: number; //	预留字段
  reason: string; //	预留字段
  time_expiration: number; //	过期时间。挂单创建后有效
  time_done: number; //	结束时间。订单彻底结束时间。如 持仓平仓、挂单删除
  type: number; //	做单方向。0=buy,1=sell
  origin_type: number; //	原始的type值。如挂单 type=2 buy limit 成交后 type 设置为0
  order_price: number; //	挂单价格
  trigger_price: number; //	触及价格
  status: number; //	状态。1=挂单中，2=已建仓，3=已平仓，4=已关闭
  open_price: number; //	建仓价格
  open_time: number; //	建仓时间
  from_id: number; //	源ID。如订单部分平仓时，就订单平仓对应手数并结束，余下手数自动生成新订单
  position_id: number; //	订单组ID。建仓时为id值。部分平仓时，position_id保持不变
  volume: number; //	手数
  sl_price: number; //	止损价
  tp_price: number; //	止盈价
  close_price: number; //	平仓价。持仓中唤作“最新价”更合适
  close_time: number; //	平仓时间
  storage: number; //	过夜费
  fee: number; //	手续费
  profit: number; //	浮动盈亏
  comment: string; //	备注评论
  order_price_time: number;
  pre_currency: string;
}

export interface reqHistoryOrders {
  limit_id?: number; //	挂单ID < limit_id
  open_begin_time?: string; //	挂单创建时间的最小值。YYYY-mm-dd HH:ii:ss
  open_end_time?: string; //	挂单创建时间的最大值。YYYY-mm-dd HH:ii:ss
  close_begin_time?: string; //	挂单创建时间的最小值。YYYY-mm-dd HH:ii:ss
  close_end_time?: string; //	挂单创建时间的最大值。YYYY-mm-dd HH:ii:ss
  count?: number; //	最大2000
  symbol?: string; //	商品
  types?: number[]; // 类型筛选，默认 [0,1]
  setup_begin_time?: string; // 创建时间的最小值。YYYY-mm-dd HH:ii:ss 或 秒级时间戳
  setup_end_time?: string; // 创建时间的最大值。YYYY-mm-dd HH:ii:ss 或 秒级时间戳
}
export interface resHistoryOrders {
  id: number; //	订单ID
  login: number; //	订单账户
  time_setup: number; //	订单创建时间，即记录插入时间。挂单成交后 time_setup 与 open_time 不一样
  symbol: string; //	订单交易商品
  digits: number; //	订单交易商品报价小数位数
  currency_digits: number; //	订单法币小数位数
  contract_size: number; //	订单商品合约数量
  state: number; //	预留字段
  reason: string; //	预留字段
  time_expiration: number; //	过期时间。挂单创建后有效
  time_done: number; //	结束时间。订单彻底结束时间。如 持仓平仓、挂单删除
  type: number; //	做单方向。0=buy,1=sell
  origin_type: number; //	原始的type值。如挂单 type=2 buy limit 成交后 type 设置为0
  order_price: number; //	挂单价格
  trigger_price: number; //	触及价格
  status: number; //	状态。1=挂单中，2=已建仓，3=已平仓，4=已关闭
  open_price: number; //	建仓价格
  open_time: number; //	建仓时间
  from_id: number; //	源ID。如订单部分平仓时，就订单平仓对应手数并结束，余下手数自动生成新订单
  position_id: number; //	订单组ID。建仓时为id值。部分平仓时，position_id保持不变
  volume: number; //	手数
  sl_price: number; //	止损价
  tp_price: number; //	止盈价
  close_price: number; //	平仓价。持仓中唤作“最新价”更合适
  close_time: number; //	平仓时间
  storage: number; //	过夜费
  fee: number; //	手续费
  profit: number; //	浮动盈亏
  comment: string; //	备注评论
  close_type?: number; // 平仓类型。平仓类型，0=手动，1=sl，2=tp，3=强平
  pre_currency: string;
}

interface reqDelPendingOrders {
  id: number; //	要修改的订单ID
  symbol: string; //	商品
}

interface resDelPendingOrders {
  login: number; //	订单账户
  id: number; //	修改的订单ID
  symbol: string; //	商品
  action_success: boolean; //	是否操作成功
  err_text: string; //	失败原因。需映射成国际化语言
}
export interface reqEditOpeningOrders {
  symbol: string; //	商品
  id: number; //	订单ID
  sl?: number; //	止损价
  tp?: number; //	止盈价
}
interface resEditOpeningOrders {
  login: number; //	订单账户
  symbol: string; //	商品
  id: number; //	订单ID
  sl: number; //	最新止损价
  tp: number; //	最新止盈价
  action_success: boolean; // 是否操作成功
  err_text: string;
}
// 市价建单
export const marketOrdersAdd = (data: ReqOrderAdd) => {
  return request<ResOrderAdd>({
    url: Api.MarketOrdersAdd,
    method: "post",
    data,
    needLogin: true,
    noTip: true,
  });
};

// 查询持仓
export const openningOrders = () => {
  return request<resOrders[]>({
    url: Api.OpenningOrders,
    method: "post",
    needLogin: true,
  });
};

// 更新持仓
export const editopenningOrders = (data: reqEditOpeningOrders) => {
  return request<resEditOpeningOrders>({
    url: Api.EditPendingOrders,
    method: "post",
    data,
    needLogin: true,
    noTip: true,
  });
};

// 平仓
export const marketOrdersClose = (data: reqMarketClose) => {
  return request<resMarketClose>({
    url: Api.MarketOrdersAddClose,
    method: "post",
    data,
    needLogin: true,
    noTip: true,
  });
};

// 添加挂单
export const pendingOrdersAdd = (data: reqPendingOrdersAdd) => {
  return request<resPendingOrdersAdd>({
    url: Api.PendingOrdersAdd,
    method: "post",
    data,
    needLogin: true,
    noTip: true,
  });
};

// 查询有效挂单
export const pendingOrders = () => {
  return request<resPendingOrders[]>({
    url: Api.PendingOrders,
    method: "post",
    needLogin: true,
  });
};

// 查询失效挂单/委托单
export const invalidPendingOrders = (data: reqHistoryPendingOrders) => {
  return request<resPendingOrders[]>({
    url: Api.HistoryPendingOrders,
    method: "post",
    data,
    needLogin: true,
  });
};

// 删除挂单
export const delPendingOrders = (data: reqDelPendingOrders) => {
  return request<resDelPendingOrders>({
    url: Api.DelPendingOrders,
    method: "post",
    data,
    needLogin: true,
    noTip: true,
  });
};

// 查询交易历史（已平仓）、出入金记录
export const historyOrders = (data: reqHistoryOrders) => {
  return request<resHistoryOrders[]>({
    url: Api.HistoryOrders,
    method: "post",
    data,
    needLogin: true,
  });
};

interface resMarketOrders {
  action_success: boolean; //	是否操作成功
  login: number;
  id: number;
}

// 市价持仓反向
export const marketOrdersReverse = (data: { id: number }) => {
  return request<resMarketOrders>({
    url: Api.MarketOrdersReverse,
    method: "post",
    data,
    needLogin: true,
  });
};

// 双倍持仓
export const marketOrdersDouble = (data: { id: number }) => {
  return request<resMarketOrders>({
    url: Api.MarketOrdersDouble,
    method: "post",
    data,
    needLogin: true,
  });
};

// 市价按模式平仓;
export const marketOrdersCloseMulti = (data: { multi_type: number }) => {
  return request<{
    login: number;
    multi_type: number;
    closed_ids: number[];
  }>({
    url: Api.MarketOrdersCloseMulti,
    method: "post",
    data,
    needLogin: true,
  });
};

export const editPendingOrders = (
  data: reqPendingOrdersAdd & { id: string | number }
) => {
  return request<resPendingOrdersAdd>({
    url: Api.ModifyPendingOrders,
    method: "post",
    data,
    needLogin: true,
    noTip: true,
  });
};
