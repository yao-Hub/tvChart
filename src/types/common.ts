export interface IDepth {
  ask: number;
  ask_size: number;
  bid: number;
  bid_size: number;
  askWidth: string;
  bidWidth: string;
}

export interface ISymbolListDataSource {
  symbol: string;
  bid?: string | number;
  ask?: string | number;
  variation?: string | number;
  topSort: number;
  ctm_ms?: number;
}
