import { IQuote, IRate, ISessionSymbolInfo } from "@/types/chart";
import request from "utils/http";

enum Api {
  Symbols = "/symbol/all_symbols",
  allSymbolsQuotes = "/quote/all_symbol_quotes",
  SymbolAllPath = "/admin/symbol/all_path",
  MySymbols = "/admin/my/optional_query",
  DelMySymbols = "/admin/my/optional_delete",
  AddMySymbols = "/admin/my/optional_add",
  EditMySymbols = "/admin/my/optional_update",
  SymbolDetail = "/symbol/one_symbol",
  AllRates = "/rate/all_rates",
}

// 获取交易商线路的所有交易商品
export interface TimeInfo {
  symbol: string;
  week_day: number;
  btime: number;
  etime: number;
}
export const getAllSymbol = (data: { group: string }) => {
  return request<ISessionSymbolInfo[]>({
    url: Api.Symbols,
    data,
    noNeedToken: true,
    method: "post",
    needLogin: true,
  });
};
export interface reqOptionalQuery {
  symbol: string; //	商品
  sort: number; //	排序
  topSort: number; //	置顶排序
}

export const allSymbolQuotes = () => {
  return request<IQuote[]>({
    url: Api.allSymbolsQuotes,
    noNeedToken: true,
    method: "post",
  });
};

// 获取所有汇率;
export const alllRates = () => {
  return request<IRate[]>({
    url: Api.AllRates,
    method: "post",
    needLogin: true,
  });
};

// 根据商品编码查询商品信息;
interface IOneSymbol {
  symbol: string;
  group: string;
}
export const getSymbolDetail = (data: IOneSymbol) => {
  return request<ISessionSymbolInfo>({
    url: Api.SymbolDetail,
    method: "post",
    data,
    needLogin: true,
  });
};

// 查询商品分类
export interface resSymbolAllPath {
  type: string; //	商品类别
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
    topSort: number | null;
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
export const editOptionalQuery = (data: reqAddOptionalQuery) => {
  return request({
    url: Api.EditMySymbols,
    method: "post",
    urlType: "admin",
    needLogin: true,
    data,
  });
};
