import { defineStore } from 'pinia'
import SingletonSocket from 'utils/socket'

const socket = SingletonSocket.getInstance(import.meta.env.VITE_WEB_SOCKET_URL);

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
  currentPeriod: number
  klineList: KlineList
  currentSymbol: string
  quoteList: {
    [value: string]: quoteItem
  }
}

const lineChartStore = defineStore('lineChartStore', {
  state(): State {
    return {
      currentPeriod: 1,
      currentSymbol: '',
      klineList: {},
      quoteList: {}
    }
  },
  actions: {
    startGetKline() {
      socket!.on('kline_new', (data: any) => {
        if (data.period_type === this.currentPeriod && data.symbol === this.currentSymbol) {
          this.klineList[this.currentSymbol] = data.klines
        }
      });
    },

    startGetQuote() {
      socket!.on('quote', (data: quoteItem) => {
        if (data.symbol === this.currentSymbol) {
          this.quoteList[this.currentSymbol] = data
        }
      });
    },

    changeSymbol(symbol: string) {
      this.currentSymbol = symbol;
    },
    changePeriod(period: number) {
      this.currentPeriod = period;
    },
    clearKineList() {
      this.klineList = {}
    }
  }
})

export default lineChartStore
