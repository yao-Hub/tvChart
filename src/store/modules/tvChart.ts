import { defineStore } from 'pinia'
import { IChartingLibraryWidget } from '../../../public/charting_library/charting_library';
import { subscribeSocket, unsubscribeSocket } from 'utils/socket/operation'
import { SessionSymbolInfo, TVSymbolInfo } from '@/types/chart/index'

interface State {
  chartWidget: IChartingLibraryWidget | null
  symbols: SessionSymbolInfo[]
  barsCache: Map<string, any>
}

interface TurnSocket {
  subscriberUID: string
  symbolInfo: TVSymbolInfo
  resolution: number
}

const tvChartStore = defineStore('tvChartStore', {
  state(): State {
    return {
      chartWidget: null,
      symbols: [],
      barsCache: new Map()
    }
  },
  actions: {
    subscribe(args: TurnSocket) {
      const { subscriberUID, symbolInfo, resolution } = args;
      this.barsCache.set(subscriberUID, {
        ...symbolInfo,
        resolution
      });
      subscribeSocket({ resolution, symbol: symbolInfo.name });
    },
    unsubscribe(subscriberUID: string) {
      const { resolution, name } = this.barsCache.get(subscriberUID);
      unsubscribeSocket({ resolution, symbol: name });
      this.barsCache.delete(subscriberUID);
    }
  }
})

export default tvChartStore
