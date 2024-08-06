import { defineStore } from "pinia";
import { assign } from "lodash";
import { uniq, difference } from "lodash";
import { subscribeSocket, unsubscribeSocket } from "utils/socket/operation";
import { SessionSymbolInfo, TVSymbolInfo } from "@/types/chart/index";
import { keydownList } from "utils/keydown";
import { useChartInit } from "./chartInit";
import { useDialog } from "./dialog";
import { useOrder } from "./order";

import { allSymbolQuotes } from "api/symbols/index";

interface State {
  symbols: SessionSymbolInfo[];
  barsCache: Map<string, any>;
  mustSubscribeList: Array<string>;
  chartsLoading: boolean;
}

interface TurnSocket {
  subscriberUID: string;
  symbolInfo: TVSymbolInfo;
  resolution: string;
}

export const useChartSub = defineStore("chartSub", {
  state: (): State => {
    return {
      symbols: [],
      barsCache: new Map(),

      // 必须需要监听品种列表
      mustSubscribeList: [],
      chartsLoading: false,
    };
  },
  actions: {
    async setSymbols(list: SessionSymbolInfo[]) {
      const orderStore = useOrder();
      this.symbols = list;
      list.forEach((item) => {
        subscribeSocket({ resolution: "1", symbol: item.symbol });
      });
      const resQuotes = await allSymbolQuotes();
      resQuotes.data.forEach((item) => {
        orderStore.currentQuotes[item.symbol] = item;
      });
    },
    // 设置必须监听品种
    setMustSubscribeList(sources: Array<string>) {
      const barsCacheSymbols: Array<string> = [];
      this.barsCache.forEach((item) => {
        barsCacheSymbols.push(item.name);
      });
      const nowsubList = uniq([...this.mustSubscribeList, ...barsCacheSymbols]);
      const subList = difference(sources, nowsubList);
      subList.forEach((item) => {
        subscribeSocket({ resolution: "1", symbol: item });
      });
      this.mustSubscribeList = uniq([...this.mustSubscribeList, ...sources]);
    },

    // k线图监听k线和报价
    subscribeKline(args: TurnSocket) {
      const { subscriberUID, symbolInfo, resolution } = args;
      this.barsCache.set(subscriberUID, {
        ...symbolInfo,
        resolution,
      });
      subscribeSocket({ resolution, symbol: symbolInfo.name });
    },
    // k线图取消监听k线和报价
    unsubscribeKline(subscriberUID: string) {
      const { resolution, name } = this.barsCache.get(subscriberUID);
      unsubscribeSocket({ resolution, symbol: name });
      this.barsCache.delete(subscriberUID);
    },
    // 监听点击报价加号按钮（显示加号菜单）
    subscribePlusBtn() {
      const dialogStore = useDialog();
      const chartInitStore = useChartInit();
      const widgetList = chartInitStore.chartWidgetList;
      widgetList.forEach((Widget) => {
        Widget.widget?.subscribe("onPlusClick", (e) => {
          assign(dialogStore.floatMenuParams, { ...e, visible: true });
        });
      });
    },
    // 监听鼠标按下动作 （隐藏加号菜单）
    subscribeMouseDown(id?: string) {
      const dialogStore = useDialog();
      const chartInitStore = useChartInit();
      const widget = chartInitStore.getChartWidget(id);
      widget?.subscribe("mouse_down", (e) => {
        const { visible } = dialogStore.floatMenuParams;
        if (visible) {
          assign(dialogStore.floatMenuParams, { ...e, visible: false });
        }
      });
    },
    // 监听键盘快捷键
    subscribeKeydown(widget: any) {
      keydownList.forEach((item) => {
        widget.onShortcut(item.keyCode, item.callback);
      });
      document.addEventListener("keydown", (event) => {
        const found = keydownList.find((e) => e.keyCode === event.keyCode);
        found?.callback();
      });
    },
  },
});
