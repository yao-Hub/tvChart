import request from "utils/http";

enum Api {
  allSymbols = "/symbol/all_symbols",
  allSymbolsQuotes = "/quote/all_symbol_quotes",
  SymbolAllPath = "/symbol/all_path",
  MySymbols = "/my/optional_query",
  DelMySymbols = "/my/optional_delete",
  AddMySymbols = "/my/optional_add",
  EditMySymbols = "/my/optional_update",
}

// 获取交易商线路的所有交易品种
interface TimeInfo {
  symbol: string;
  week_day: number;
  btime: number;
  etime: number;
}
export interface ResSymbolsInfo {
  server: string;
  id: number;
  path: string;
  digits: number;
  volume_min: number;
  volume_step: number;
  volume_max: number;
  volume_max_total: number;
  stops_level: number;
  margin: number;
  contract_size: number;
  trade_allow: number;
  ttimes: Array<Array<Array<TimeInfo>>>;
  holidays: (string | number)[];
  symbol: string;
}
export const allSymbols = () => {
  return request<ResSymbolsInfo>({
    url: Api.allSymbols,
    noNeedToken: true,
    method: "post",
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

interface reqOptionalQuery {
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
