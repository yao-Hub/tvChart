export interface ISocketQuote {
  ask: number;
  bid: number;
  ctm: number;
  ctm_ms: number;
  server: string;
  symbol: string;
}

export interface ISocketKlineNew {
  period_type: number;
  server: string;
  symbol: string;
  klines: ILine[];
}
export interface IQuote {
  ctm_ms: number; //	时间，毫秒级
  ctm: number; //	时间
  symbol: string; //	商品编码
  ask: number; //	买价
  bid: number; //	卖价
  server: string; //	经济商交易线路编码
  open: number; //	最新一个交易日的开盘价
  high: number; //	最新一个交易日的最高价
  low: number; //	最新一个交易日的最低价
  close: number; //	最新一个交易日的收盘价
  volume: number; //	最新一个交易日的交易量
}

export interface ILine {
  close: number;
  ctm: number;
  date_time: string;
  high: number;
  low: number;
  open: number;
  volume: number;
}

export interface IRate {
  symbol: string; //	汇率币种
  bid_rate: number; //	卖出汇率
  ask_rate: number; //	买入汇率
  update_time: number; //	最新更新时间
}

export enum Periods {
  "1D" = 1440,
  "1W" = 10080,
  "1M" = 43200,
}

export interface ITVSymbolInfo {
  name: string;
  [value: string]: any;
}

export interface ISessionSymbolInfo {
  id: number; // 时间，毫秒级
  symbol: string; // 商品编码
  path: string; // 商品路径
  digits: number; // 报价位数
  volume_min: number; // 单笔交易最小手数，1=0.01手
  volume_step: number; // 单笔交易手数的最小步值。5=0.05手，即手数只能是0.05的倍数
  volume_max: number; // 单笔交易最大手数
  volume_max_total: number; // 单个账户最大持仓手数
  stops_level: number; // 交易距离。200=200点。即digits=2时，止损止盈等设定需远离现价2。digits=3时，止损止盈等设定需远离现价0.2
  margin: number; // 1手固定的预付款金额
  contract_size: number; // 合约数量
  trade_allow: number; // 是否能交易，1=是。
  ttimes: Array<Array<TimeUnit>>; // 交易时间段。休闭市设定
  holidays: []; // 假期。 休闭市设定
  session?: string; // 交易时间段
  leverage: number; // 固定的杠杆倍数
  fee: number; // 1手固定的手续费金额
  storage: number; // 过夜费
  description: string;
  buy_rate: number;
  currency: string; // 后币种
  pre_currency: string; // 前币种
  sell_rate: number;
  settlement_btime: number; // 结算时段的开始时间
  settlement_etime: number; // 结算时段的结束时间
  settlement_type: number; // 1=休市结算，2=满24小时结算
  status: number; // 1=启用
  utrader_trade_allow: number; // 1=utrader开发交易许可
  current_trade_able: number; // 当前时刻是否开市 1=开市，0=休市
}

export interface PeriodParams {
  from: number;
  to: number;
  countBack: number;
  firstDataRequest: Boolean;
}

export interface TimeUnit {
  btime: number;
  etime: number;
  symbol: string;
  week_day: number;
  session?: string;
}

/* ​"stock" | "index" | "forex" | "futures" | "bitcoin" | "crypto" | "undefined" 
| "expression" | "spread" | "cfd" | "economic" | "equity" | "dr" | "bond" 
| "right" | "warrant" | "fund" | "structured" | "commodity" | "fundamental" | "spot" | "swap"
*/
export enum Type {
  stock = "股票",
  futures = "期货",
  forex = "外汇",
  index = "指数",
}
