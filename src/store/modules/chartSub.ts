import { ITVSymbolInfo } from "@/types/chart";
import { defineStore } from "pinia";
import { IChartingLibraryWidget } from "public/charting_library";
import { keydownList } from "utils/keydown";
import { useSocket } from "./socket";

type TcacheItem = ITVSymbolInfo & { resolution: string };
interface IState {
  barsCache: Map<string, TcacheItem>;
  chartsLoading: boolean;
}

interface TurnSocket {
  subscriberUID: string;
  symbolInfo: ITVSymbolInfo;
  resolution: string;
}

export const useChartSub = defineStore("chartSub", {
  state: (): IState => {
    return {
      barsCache: new Map(),
      chartsLoading: false,
    };
  },
  actions: {
    // k线图监听k线和报价
    subChartKlineQuote(args: TurnSocket) {
      const socketStore = useSocket();
      const { subscriberUID, symbolInfo, resolution } = args;
      this.barsCache.set(subscriberUID, {
        ...symbolInfo,
        resolution,
      });
      socketStore.emitKlineQuote({ resolution, symbol: symbolInfo.name });
    },
    // k线图取消监听k线和报价
    unsubChartKlineQuote(subscriberUID: string) {
      const socketStore = useSocket();
      const target = this.barsCache.get(subscriberUID);
      if (target) {
        const { resolution, name } = target;
        socketStore.unsubKlineQuote({ resolution, symbol: name });
        this.barsCache.delete(subscriberUID);
      }
    },
    // 监听点击报价加号按钮（显示加号菜单）
    // subscribePlusBtn() {
    //   const dialogStore = useDialog();
    //   const chartInitStore = useChartInit();
    //   const widgetList = chartInitStore.state.chartWidgetList;
    //   widgetList.forEach((Widget) => {
    //     Widget.widget?.subscribe("onPlusClick", (e) => {
    //       assign(dialogStore.floatMenuParams, { ...e, visible: true });
    //     });
    //   });
    // },
    // 监听鼠标按下动作 （隐藏加号菜单）
    // subscribeMouseDown(id: string) {
    //   const dialogStore = useDialog();
    //   const chartInitStore = useChartInit();
    //   const widget = chartInitStore.getChartWidget(id);
    //   widget?.subscribe("mouse_down", (e) => {
    //     const { visible } = dialogStore.floatMenuParams;
    //     if (visible) {
    //       assign(dialogStore.floatMenuParams, { ...e, visible: false });
    //     }
    //   });
    // },
    // 监听键盘快捷键
    subscribeKeydown(widget: IChartingLibraryWidget) {
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
