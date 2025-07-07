import request from "utils/http";

enum Api {
  klineHistory = "/kline/history",
}

export interface ReqLineInfo {
  period_type: number | string;
  symbol: string;
  count: number;
  limit_ctm: number;
  limit_begin_ctm?: number;
}

export interface ResLineInfo {
  ctm: number; // 时间
  open: number; // 开盘价
  high: number; // 最高价
  low: number; // 最低价
  close: number; // 收盘价
  volume: number; // 交易量
  timeStamp?: number;
  time: number;
}

/**
 * 获取历史K线接口
 */
export const klineHistory = (data: ReqLineInfo) => {
  return request<ResLineInfo[]>({
    url: Api.klineHistory,
    method: "post",
    noNeedToken: true,
    data,
  });
};
