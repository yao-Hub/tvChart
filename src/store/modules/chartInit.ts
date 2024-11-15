import { defineStore } from "pinia";
import {
  IChartingLibraryWidget,
  ResolutionString,
} from "public/charting_library";
import { useOrder } from "./order";
import { useStorage } from "./storage";

interface State {
  chartWidgetList: {
    widget?: IChartingLibraryWidget;
    id: string;
    symbol?: string;
    interval?: ResolutionString;
  }[];
  loading: Boolean;
  chartLayoutType: "single" | "multiple";
  chartLoading: Record<string, boolean>;
  activeChartId: string;
  chartFlexDirection: "row" | "column";
}

export const useChartInit = defineStore("chartInit", {
  state: (): State => {
    return {
      chartWidgetList: [],
      loading: true,
      chartLayoutType: "single",
      chartLoading: {},
      activeChartId: "chart_1",
      chartFlexDirection: "row",
    };
  },
  actions: {
    // 创建图表实例
    createChartWidget(id: string, widget: IChartingLibraryWidget) {
      const index = this.chartWidgetList.findIndex((e) => e.id === id);
      const obj = {
        widget,
        id,
        symbol: widget.symbolInterval().symbol,
        interval: widget.symbolInterval().interval,
      };
      if (index === -1) {
        this.chartWidgetList.push(obj);
      } else {
        this.chartWidgetList[index] = obj;
      }
    },

    // 获取图表实例
    getChartWidget(id: string) {
      if (this.chartWidgetList.length === 0) {
        throw new Error("chartWidget is null");
      }
      return this.chartWidgetList.find((e) => e.id === id)?.widget;
    },

    // 移除chart实例
    removeChartWidget(id: string) {
      if (this.chartWidgetList.length === 1) {
        return;
      }
      const index = this.chartWidgetList.findIndex((e) => e.id === id);
      this.chartWidgetList.splice(index, 1);
      if (id === this.activeChartId) {
        this.activeChartId = this.chartWidgetList[0].id;
      }
    },

    addChart() {
      const orderStore = useOrder();
      const ids = this.chartWidgetList.map((item) => +item.id.split("_")[1]);
      const minId = Math.min(...ids) as number;
      const maxId = Math.max(...ids) as number;
      const fullRange = new Set(
        [...Array(maxId - minId + 1).keys()].map((i) => i + minId)
      );
      const arrSet = new Set(ids);
      const missingIds = [...fullRange].filter((num) => !arrSet.has(num));
      const addId = missingIds.length ? missingIds[0] : maxId + 1;
      this.chartWidgetList.push({
        id: `chart_${addId}`,
        symbol: orderStore.currentSymbol,
      });
    },

    // 获取chartWidgetList的symbol字段
    getChartWidgetListSymbol(id: string) {
      if (this.chartWidgetList.length === 0) {
        throw new Error("chartWidget is null");
      }
      return this.chartWidgetList.find((e) => e.id === id)?.symbol;
    },

    setChartMapSymbolInterval(params: {
      id: string;
      symbol?: string;
      interval?: ResolutionString;
    }) {
      const { id, symbol, interval } = params;
      const targetItem = this.chartWidgetList.find((e) => e.id === id);
      if (targetItem && symbol) {
        targetItem.symbol = symbol;
      }
      if (targetItem && interval) {
        targetItem.interval = interval;
      }
    },

    // 设置图表品种
    changeChartSymbol(params: { id: string; symbol: string }) {
      const { id, symbol } = params;
      const target = this.chartWidgetList.find((e) => e.id === id);
      if (target) {
        target.symbol = symbol;
        target.widget?.onChartReady(() => {
          target.widget?.headerReady().then(() => {
            target.widget?.activeChart()?.setSymbol(symbol);
          });
        });
      }
    },

    // 设置图表品种
    changeChartInterval(params: { id: string; resolution: ResolutionString }) {
      const { id, resolution } = params;
      const target = this.chartWidgetList.find((e) => e.id === id);
      if (target) {
        target.interval = resolution;
        target.widget?.onChartReady(() => {
          target.widget?.headerReady().then(() => {
            target.widget?.activeChart()?.setResolution(resolution);
          });
        });
      }
    },

    intLayoutType() {
      const storageStore = useStorage();
      const type = storageStore.getItem(
        "chartLayoutType"
      ) as State["chartLayoutType"];
      if (type) {
        this.chartLayoutType = type;
      }
    },
    setLayoutType(type: State["chartLayoutType"]) {
      const storageStore = useStorage();
      this.chartLayoutType = type;
      storageStore.setItem("chartLayoutType", type);
    },
    intChartFlexDirection() {
      const storageStore = useStorage();
      const type = storageStore.getItem(
        "chartFlexDirection"
      ) as State["chartFlexDirection"];
      if (type) {
        this.chartFlexDirection = type;
      }
    },
    setChartFlexDirection(type: State["chartFlexDirection"]) {
      const storageStore = useStorage();
      this.chartFlexDirection = type;
      storageStore.setItem("chartFlexDirection", type);
    },

    saveCharts() {
      const storageStore = useStorage();
      const saveMap: Record<string, any> = {};
      this.chartWidgetList.forEach((item) => {
        item.widget?.save((state) => {
          saveMap[item.id] = state;
        });
      });
      storageStore.setItem("chartList", this.chartWidgetList);
      storageStore.setItem("chartInfoMap", saveMap);
    },

    loadChartList() {
      const storageStore = useStorage();
      const orderStore = useOrder();
      let result = [{ id: "chart_1", symbol: orderStore.currentSymbol }];
      const wList = storageStore.getItem("chartList");
      if (wList && wList.length) {
        result = wList;
      }
      this.chartWidgetList = result;
    },
    loadCharts(id?: string) {
      const storageStore = useStorage();
      const sMap = storageStore.getItem("chartInfoMap");
      if (sMap) {
        if (id) {
          const found = this.chartWidgetList.find((e) => e.id === id);
          if (found) found.widget?.load(sMap[id]);
          return;
        }
        this.chartWidgetList.forEach((item) => {
          if (sMap[item.id]) {
            item.widget?.load(sMap[item.id]);
          }
        });
      }
    },
  },
});
