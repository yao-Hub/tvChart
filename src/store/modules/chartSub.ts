import { defineStore } from 'pinia'
import { assign } from 'lodash';
import { subscribeSocket, unsubscribeSocket } from 'utils/socket/operation'
import { SessionSymbolInfo, TVSymbolInfo } from '@/types/chart/index'
import { keydownList } from 'utils/keydown';
import { useChartInit } from './chartInit';
import { useDialog } from './dialog';

const dialogStore = useDialog();
const chartInitStore = useChartInit();

interface Keydown {
  key: string
  keyCode: number
  callback: void
}

interface State {
  symbols: SessionSymbolInfo[]
  barsCache: Map<string, any>
  keydownList: Array<Keydown>
}

interface TurnSocket {
  subscriberUID: string
  symbolInfo: TVSymbolInfo
  resolution: string
}

export const useChartSub = defineStore('chartSub', {
  state(): State {
    return {
      symbols: [],
      barsCache: new Map(),
      keydownList: []
    }
  },
  getters: {
    chartWidget: () => chartInitStore.getChartWidget()
  },
  actions: {
    // 监听k线
    subscribeKline(args: TurnSocket) {
      const { subscriberUID, symbolInfo, resolution } = args;
      this.barsCache.set(subscriberUID, {
        ...symbolInfo,
        resolution
      });
      subscribeSocket({ resolution, symbol: symbolInfo.name });
    },
    // 取消监听k线
    unsubscribeKline(subscriberUID: string) {
      const { resolution, name } = this.barsCache.get(subscriberUID);
      unsubscribeSocket({ resolution, symbol: name });
      this.barsCache.delete(subscriberUID);
    },
    // 监听点击报价加号按钮
    subscribePlusBtn() {
      this.chartWidget.subscribe('onPlusClick', (e) => {
        assign(dialogStore.floatMenuParams, { ...e, visible: true });
      })
    },
    // 监听鼠标按下动作
    subscribeMouseDown() {
      this.chartWidget.subscribe('mouse_down', (e) => {
        const { visible } = dialogStore.floatMenuParams;
        if (visible) {
          assign(dialogStore.floatMenuParams, { ...e, visible: false });
        }
      })
    },
    // 监听键盘快捷键
    subscribeKeydown() {
      keydownList.forEach(item => {
        this.chartWidget!.onShortcut(item.keyCode, item.callback);
      })
      document.addEventListener("keydown", (event) => {
        const found = keydownList.find(e => e.keyCode === event.keyCode);
        found?.callback();
      });
    }
  }
})
