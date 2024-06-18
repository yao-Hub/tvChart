export interface ChartData {
  open: number
  high: number
  low: number
  close: number
  timestamp?: number
  date_time?: string | number
  ctm?: number
  volume?: number
}

export interface Quote {
  ask: number
  bid: number
  ctm: number
  ctm_ms: number
  server: string
  symbol: string
}

export interface Line {
  close: number
  ctm: number
  date_time: string
  high: number
  low: number
  open: number
  volume: number
}

export enum Periods {
  '1D' = 1440,
  '1W' = 10080,
  '1M' = 43200
}

export interface TVSymbolInfo {
  name: string
  [value: string]: any
}

export interface SessionSymbolInfo {
  id: number	// 时间，毫秒级
  symbol: string	// 品种编码
  path: string	// 品种路径
  digits: number	// 报价位数
  volume_min: number	// 单笔交易最小手数，1=0.01手
  volume_step: number	// 单笔交易手数的最小步值。5=0.05手，即手数只能是0.05的倍数
  volume_max: number	// 单笔交易最大手数
  volume_max_total: number	// 单个账户最大持仓手数
  stops_level: number	// 交易距离。200=200点。即digits=2时，止损止盈等设定需远离现价2。digits=3时，止损止盈等设定需远离现价0.2
  margin: number	// 1手固定的保证金金额
  contract_size: number	// 合约数量
  trade_allow: number	// 是否能交易，1=是。
  ttimes: Array<Array<TimeUnit>> // 交易时间段。休闭市设定
  holidays: []	// 假期。 休闭市设定
  session?: string
  leverage: number
  fee: number
  storage: number
}

export interface LineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  ctm?: number
}

export interface PeriodParams {
  from: number
  to: number
  countBack: number
  firstDataRequest: Boolean
}

export type Resolution = number

export interface TimeUnit {
  btime: number
  etime: number
  symbol: string
  week_day: number
  session?: string
}

/* ​"stock" | "index" | "forex" | "futures" | "bitcoin" | "crypto" | "undefined" 
| "expression" | "spread" | "cfd" | "economic" | "equity" | "dr" | "bond" 
| "right" | "warrant" | "fund" | "structured" | "commodity" | "fundamental" | "spot" | "swap"
*/
export enum Type {
  stock = '股票',
  futures = '期货',
  forex = '外汇',
  index = '指数'
}