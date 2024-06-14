import request from 'utils/http'

enum Api {
  allSymbols = 'symbol/all_symbols',
  allSymbolsQuotes = 'quote/all_symbol_quotes'
}

interface TimeInfo {
  symbol: string;
  week_day: number;
  btime: number;
  etime: number;
}

export interface ResSymbolsInfo {
  server: string
  id: number
  path: string
  digits: number
  volume_min: number
  volume_step: number
  volume_max: number
  volume_max_total: number
  stops_level: number
  margin: number
  contract_size: number
  trade_allow: number
  ttimes: Array<Array<Array<TimeInfo>>>;
  holidays: (string | number)[]
  symbol: string
}

export interface ResQuote {
  ctm_ms:	number //	时间，毫秒级
  ctm:	number //	时间
  symbol:	string //	品种编码
  ask:	number //	买价
  bid:	number //	卖价
  server:	string //	经济商交易线路编码
}

/**
 * 获取交易商线路的所有交易品种
 */
export const allSymbols = () => {
  return request<ResSymbolsInfo>({
    url: Api.allSymbols,
    method: 'post',
  })
}

// 获取所有报价
export const allSymbolQuotes = () => {
  return request<ResQuote[]>({
    url: Api.allSymbolsQuotes,
    method: 'post',
  })
}
