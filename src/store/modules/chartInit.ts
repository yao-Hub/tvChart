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
    setChartSymbol(params: { id: string; symbol: string }) {
      const { id, symbol } = params;
      const find = this.chartWidgetList.find((e) => e.id === id);
      if (find) {
        find.symbol = symbol;
      }
    },

    // 根据list的symbol字段重新设置当前图的symbol
    setSymbolBack(id?: string) {
      if (id) {
        this.singleChartLoading[id] = true;
        const symbol = this.getChartSymbol(id);
        const widget = this.getChartWidget(id);
        symbol && widget?.onChartReady(() => {
          widget.headerReady().then(() => {
            widget?.activeChart()?.setSymbol(symbol);
          });
        });
        this.singleChartLoading[id] = false;
        return;
      }
      this.chartWidgetList.forEach((item) => {
        this.singleChartLoading[item.id] = true;
        const widget = item.widget;
        const symbol = item.symbol;
        symbol && widget?.onChartReady(() => {
          widget.headerReady().then(() => {
            widget.activeChart().setSymbol(symbol);
          });
        });
        this.singleChartLoading[item.id] = false;
      });
    }
  },
});
