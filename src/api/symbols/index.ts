import request from 'utils/http'

enum Api {
  allSymbols = 'symbol/all_symbols'
}

interface ReqSymbolsInfo {
  server: string
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

/**
 * 获取交易商线路的所有交易品种
 */
export const allSymbols = (data: ReqSymbolsInfo) => {
  return request<ResSymbolsInfo>({
    url: Api.allSymbols,
    method: 'post',
    data
  })
}
