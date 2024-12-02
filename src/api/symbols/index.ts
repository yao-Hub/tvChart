import request from "utils/http";
import { ISessionSymbolInfo } from "@/types/chart/index";

enum Api {
  allSymbols = "/symbol/all_symbols",
  allSymbolsQuotes = "/quote/all_symbol_quotes",
  SymbolAllPath = "/symbol/all_path",
  MySymbols = "/my/optional_query",
  DelMySymbols = "/my/optional_delete",
  AddMySymbols = "/my/optional_add",
  EditMySymbols = "/my/optional_update",
  SymbolDetail = "/symbol/one_symbol",
}

// 获取交易商线路的所有交易品种
interface TimeInfo {
  symbol: string;
  week_day: number;
  btime: number;
  etime: number;
}
export const allSymbols = () => {
  return request<ISessionSymbolInfo[]>({
    url: Api.allSymbols,
    noNeedToken: true,
    method: "post",
    needLogin: true,
  });
};

// 获取所有报价
export interface ResQuote {
  ctm_ms: number; //	时间，毫秒级
  ctm: number; //	时间
  symbol: string; //	品种编码
  ask: number; //	买价
  bid: number; //	卖价
  server: string; //	经济商交易线路编码
  open: number; //	最新一个交易日的开盘价
  high: number; //	最新一个交易日的最高价
  low: number; //	最新一个交易日的最低价
  close: number; //	最新一个交易日的收盘价
  volume: number; //	最新一个交易日的交易量
  // one_min_klines	list	最新的720条1分钟k线数据
}

export interface reqOptionalQuery {
  symbols: string; //	品种
  sort: number; //	排序
  topSort: number; //	置顶排序
}
export const allSymbolQuotes = () => {
  return request<ResQuote[]>({
    url: Api.allSymbolsQuotes,
    noNeedToken: true,
    method: "post",
  });
};

// 根据品种编码查询品种信息;
interface IOneSymbol {
  symbol: string;
}
export interface ISymbolDetail {
  id: number; //	时间，毫秒级
  symbol: string; //	品种编码
  path: string; //	品种路径
  digits: number; //	报价位数
  currency: string; //	品种法币币种
  volume_min: number; //	单笔交易最小手数，1=0.01手
  volume_step: number; //	单笔交易手数的最小步值。5=0.05手，即手数只能是0.05的倍数
  volume_max: number; //	单笔交易最大手数
  volume_max_total: number; //	单个账户最大持仓手数
  stops_level: number; //	交易距离。200=200点。即digits=2时，止损止盈等设定需远离现价2。digits=3时，止损止盈等设定需远离现价0.2
  margin: number; //	1手固定的保证金金额
  contract_size: number; //	合约数量
  trade_allow: number; //	是否能交易，1=是。
  leverage: number; //	固定的杠杆倍数
  buy_rate: number; //	买入建仓过夜年利率
  sell_rate: number; //	卖出建仓过夜年利率
  fee: number; //	1手固定的手续费
  ttimes: Array<Array<TimeInfo>>; //	交易时间段。休闭市设定
  holidays: Array<Array<TimeInfo>>; //		假期。 休闭市设定
  settlement_type: number; // 利润计算方式
}
export const symbolDetail = (data: IOneSymbol) => {
  return request<ISymbolDetail>({
    url: Api.SymbolDetail,
    method: "post",
    data,
    needLogin: true,
  });
};

// 查询品种分类
export interface resSymbolAllPath {
  type: string; //	品种类别
  value: string; //	tab显示名称
}
export const symbolAllPath = () => {
  return request<resSymbolAllPath[]>({
    url: Api.SymbolAllPath,
    method: "post",
    noNeedServer: true,
    noNeedToken: true,
    urlType: "admin",
  });
};

// 查询自选
export const optionalQuery = () => {
  return request<reqOptionalQuery[]>({
    url: Api.MySymbols,
    method: "post",
    urlType: "admin",
    needLogin: true,
  });
};

// 删除自选
export const delOptionalQuery = (data: { symbols: string[] }) => {
  return request({
    url: Api.DelMySymbols,
    method: "post",
    urlType: "admin",
    needLogin: true,
    data,
  });
};

// 添加自选
interface reqAddOptionalQuery {
  symbols: {
    symbol: string;
    sort: string | number;
    topSort: string | number;
  }[];
}
export const addOptionalQuery = (data: reqAddOptionalQuery) => {
  return request({
    url: Api.AddMySymbols,
    method: "post",
    urlType: "admin",
    needLogin: true,
    data,
  });
};

// 编辑自选
interface reqAddOptionalQuery {
  symbols: {
    symbol: string;
    sort: string | number;
    topSort: string | number;
  }[];
}
export const editOptionalQuery = (data: reqAddOptionalQuery) => {
  return request({
    url: Api.EditMySymbols,
    method: "post",
    urlType: "admin",
    needLogin: true,
    data,
  });
};
