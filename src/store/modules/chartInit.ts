import { defineStore } from "pinia";
import { IChartingLibraryWidget } from "public/charting_library/charting_library";

interface State {
  chartWidgetList: {
    widget?: IChartingLibraryWidget;
    id: string;
    symbol?: string;
  }[];
  loading: Boolean;
  mainId: string;
  chartLayoutType: "single" | "multiple";
  cacheSymbols: Record<string, string>;
  singleChartLoading: Record<string, boolean>;
  ifInitError: boolean
}

export const useChartInit = defineStore("chartInit", {
  state: (): State => {
    return {
      chartWidgetList: [{ id: "chart_1" }],
      loading: false,
      mainId: "",
      chartLayoutType: "multiple",
      cacheSymbols: {},
      singleChartLoading: {},
      ifInitError: false
    };
  },
  actions: {
    // 设置图表实例
    setChartWidget(id: string, widget: IChartingLibraryWidget) {
      const foundChart = this.chartWidgetList.find((e) => e.id === id);
      if (!foundChart) {
        this.chartWidgetList.push({
          widget,
          id,
          symbol: widget.symbolInterval().symbol,
        });
      }
      if (foundChart) {
        foundChart.widget = widget;
        foundChart.symbol = widget.symbolInterval().symbol;
      }
    },

    // 获取图表实例
    getChartWidget(id?: string) {
      if (this.chartWidgetList.length === 0) {
        throw new Error("chartWidget is null");
      }
      const findId = id || this.mainId;
      return this.chartWidgetList.find((e) => e.id === findId)?.widget;
    },

    // 移除chart实例
    removeChartWidget(id: string) {
      const index = this.chartWidgetList.findIndex((e) => e.id === id);
      if (index > -1) {
        this.chartWidgetList.splice(index, 1);
      }
    },

    // 获取chartWidgetList的symbol字段
    getChartSymbol(id?: string) {
      if (this.chartWidgetList.length === 0) {
        throw new Error("chartWidget is null");
      }
      const findId = id || this.mainId;
      return this.chartWidgetList.find((e) => e.id === findId)?.symbol;
    },

    // 给chartWidgetList设置品种字段
    setChartSymbol(params?: { id: string; symbol: string }) {
      if (params) {
        const { id, symbol } = params;
        const find = this.chartWidgetList.find((e) => e.id === id);
        if (find) {
          find.symbol = symbol;
        }
        return;
      }
      this.chartWidgetList.forEach((item) => {
        if (item.widget) {
          item.widget.onChartReady(() => {
            item.widget?.headerReady().then(() => {
              item.symbol = item.widget?.activeChart().symbol() || "";
            });
          });
        }
      });
    },

    getCacheSymbol(id: string) {
      return this.cacheSymbols[id];
    },

    // 设置缓存品种，不是手动触发更新品种
    setCacheSymbol(params: { symbol: string; id: string }) {
      const { id, symbol } = params;
      this.cacheSymbols[id] = symbol;
    },

    // 根据缓存的品种设置当前chart品种
    async setChartSymbolWithCache(id?: string) {
      if (id) {
        this.singleChartLoading[id] = true;
      } else {
        this.chartWidgetList.forEach((item) => {
          this.singleChartLoading[item.id] = true;
        });
      }
      setTimeout(() => {
        if (id) {
          const cacheSymbol = this.cacheSymbols[id];
          const widget = this.chartWidgetList.find((e) => e.id === id)?.widget;
          widget?.onChartReady(() => {
            widget.headerReady().then(() => {
              widget?.activeChart()?.setSymbol(cacheSymbol);
            });
          });
          this.singleChartLoading[id] = false;
          return;
        }
        this.chartWidgetList.forEach((item) => {
          const widget = item.widget;
          const cacheSymbol = this.cacheSymbols[item.id];
          widget?.onChartReady(() => {
            widget.activeChart().setSymbol(cacheSymbol);
          });
          this.singleChartLoading[item.id] = false;
        });
      }, 1000);
    },
    clearCacheSymbol(id: string) {
      delete this.cacheSymbols[id];
    },
  },
});
