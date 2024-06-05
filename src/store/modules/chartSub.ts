import { defineStore } from 'pinia'
import { assign } from 'lodash';
import { IChartingLibraryWidget } from 'public/charting_library/charting_library';
import { subscribeSocket, unsubscribeSocket } from 'utils/socket/operation'
import { SessionSymbolInfo, TVSymbolInfo } from '@/types/chart/index'
import chartDialogStore from '@/store/modules/chartDialog';

const chartDialog = chartDialogStore();

interface State {
  chartWidget: IChartingLibraryWidget | null
  symbols: SessionSymbolInfo[]
  barsCache: Map<string, any>
}

interface TurnSocket {
  subscriberUID: string
  symbolInfo: TVSymbolInfo
  resolution: string
}

const chartSubStore = defineStore('chartSubStore', {
  state(): State {
    return {
      chartWidget: null,
      symbols: [],
      barsCache: new Map()
    }
  },
  actions: {
    getChartWidget() {
      if (!this.chartWidget) {
        throw new Error('chartWidget is null')
      }
      return this.chartWidget;
    },
    subscribeKline(args: TurnSocket) {
      const { subscriberUID, symbolInfo, resolution } = args;
      this.barsCache.set(subscriberUID, {
        ...symbolInfo,
        resolution
      });
      subscribeSocket({ resolution, symbol: symbolInfo.name });
    },
    unsubscribeKline(subscriberUID: string) {
      const { resolution, name } = this.barsCache.get(subscriberUID);
      unsubscribeSocket({ resolution, symbol: name });
      this.barsCache.delete(subscriberUID);
    },
    subscribePlusBtn() {
      this.chartWidget?.subscribe('onPlusClick', (e) => {
        assign(chartDialog.floatMenuParams, { ...e, visible: true });
      })
    },
    subscribeMouseDown() {
      this.chartWidget?.subscribe('mouse_down', (e) => {
        const { visible } = chartDialog.floatMenuParams;
        if (visible) {
          assign(chartDialog.floatMenuParams, { ...e, visible: false });
        }
      })
    }
  }
})

export default chartSubStore
