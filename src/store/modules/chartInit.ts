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
  globalRefresh: boolean;
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
      globalRefresh: false,
    };
  },
  actions: {
    // 刷新
    refresh() {
      this.globalRefresh = true;
      setTimeout(() => {
        this.globalRefresh = false;
      }, 1000);
    },
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

    // 增加一个图表
    addChart(symbol?: string) {
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
      const id = `chart_${addId}`;
      this.chartWidgetList.push({
        id,
        symbol: symbol || orderStore.currentSymbol,
      });
      this.activeChartId = id;
    },

    // 获取chartWidgetList的symbol字段
    getChartWidgetListSymbol(id: string) {
      if (this.chartWidgetList.length === 0) {
        throw new Error("chartWidget is null");
      }
      return this.chartWidgetList.find((e) => e.id === id)?.symbol;
    },

    // 设置chartWidgetList对象的品种 周期字段
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

    // 设置图表显示品种
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

    // 设置图表显示周期
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

    // 初始化图表布局（单个多个）
    intLayoutType() {
      const storageStore = useStorage();
      const type = storageStore.getItem("chartLayoutType");
      this.chartLayoutType = type || "single";
    },
    // 设置图表布局（单个多个）
    setLayoutType(type: State["chartLayoutType"]) {
      const storageStore = useStorage();
      this.chartLayoutType = type;
      storageStore.setItem("chartLayoutType", type);
    },
    // 初始化图表布局方向（row or column）
    intChartFlexDirection() {
      const storageStore = useStorage();
      const type = storageStore.getItem("chartFlexDirection");
      this.chartFlexDirection = type || "row";
    },
    // 设置图表布局方向（row or column）
    setChartFlexDirection(type: State["chartFlexDirection"]) {
      const storageStore = useStorage();
      this.chartFlexDirection = type;
      storageStore.setItem("chartFlexDirection", type);
    },

    // 保存图标形态
    saveCharts() {
      try {
        const storageStore = useStorage();
        const saveMap: Record<string, any> = {};
        this.chartWidgetList.forEach((item) => {
          item.widget?.save((state) => {
            saveMap[item.id] = state;
          });
        });
        const saveChatList = this.chartWidgetList.map((item) => {
          const { id, symbol, interval } = item;
          return {
            id,
            symbol,
            interval,
          };
        });
        storageStore.setItem("chartList", saveChatList);
        storageStore.setItem("chartInfoMap", saveMap);
      } catch (error) {
        console.log("saveCharts", error);
      }
    },

    // 加载图表个数
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
    getChartSavedData(id: string) {
      const storageStore = useStorage();
      const sMap = storageStore.getItem("chartInfoMap");
      if (sMap) {
        return sMap[id];
      }
    },
    // 加载图表最后的操作形态
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
