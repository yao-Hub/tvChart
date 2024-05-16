import { defineStore } from 'pinia'
import { IChartingLibraryWidget } from '../../../public/charting_library/charting_library';
import { subscribeSocket, unsubscribeSocket } from 'utils/socket/operation'
import { SessionSymbolInfo } from  '@/types/chart/index'

interface KlineItem {
  close: number
  ctm: number
  date_time: string
  high: number
  low: number
  open: number
  volume: number
}

interface quoteItem {
  ask: number
  bid: number
  ctm: number
  ctm_ms: number
  server: string
  symbol: string
}

interface KlineList {
  [value: string]: Array<KlineItem>
}

interface State {
  chartWidget: IChartingLibraryWidget | null
  currentSymbol: string,
  currentResolution: number | string
  symbols: SessionSymbolInfo[]
}

const tvChartStore = defineStore('tvChartStore', {
  state(): State {
    return {
      chartWidget: null,
      currentSymbol: '',
      currentResolution: 1,
      symbols: []
    }
  },
  actions: {
    turnSocket(symbol: string, resolution: number) {
      if (symbol !== this.currentSymbol || resolution !== this.currentResolution) {
        subscribeSocket({ resolution, symbol });
        if (this.currentSymbol !== '') {
          unsubscribeSocket({ resolution: this.currentResolution, symbol: this.currentSymbol });
        }
      }
      this.currentResolution = resolution;
      this.currentSymbol = symbol;
    }
  }
})

export default tvChartStore
