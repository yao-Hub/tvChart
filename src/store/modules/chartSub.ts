import { defineStore } from 'pinia'
import { assign } from 'lodash';
import { subscribeSocket, unsubscribeSocket } from 'utils/socket/operation'
import { SessionSymbolInfo, TVSymbolInfo } from '@/types/chart/index'
import chartInitStore from './chartInit';
import chartDialogStore from './chartDialog';

const chartDialog = chartDialogStore();
const chartInit = chartInitStore();

interface State {
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
      symbols: [],
      barsCache: new Map()
    }
  },
  getters: {
    chartWidget: () => chartInit.getChartWidget()
  },
  actions: {
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
