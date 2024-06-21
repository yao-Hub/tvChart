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
  mustSubscribeList: Array<string>
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
      keydownList: [],

      // 必须需要监听品种列表
      mustSubscribeList: []
    }
  },
  getters: {
    chartWidget: () => chartInitStore.getChartWidget()
  },
  actions: {
    // k线图监听k线和报价
    subscribeKline(args: TurnSocket) {
      const { subscriberUID, symbolInfo, resolution } = args;
      this.barsCache.set(subscriberUID, {
        ...symbolInfo,
        resolution
      });
      subscribeSocket({ resolution, symbol: symbolInfo.name });
    },
    // k线图取消监听k线和报价
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
