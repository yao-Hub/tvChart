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
}

export const useChartInit = defineStore("chartInit", {
  state: (): State => {
    return {
      chartWidgetList: [{ id: "chart_1" }],
      loading: true,
      mainId: "",
      chartLayoutType: "multiple",
      singleChartLoading: {},
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
    },

    sortChartList(sortArr: Array<string>) {
      const indexMap = {} as Record<string, number>;
      sortArr.forEach((value, index) => {
        indexMap[value] = index;
      });
      this.chartWidgetList.sort((obj1, obj2) => {
        return indexMap[obj1.id] - indexMap[obj2.id];
      });
    },

    intLayoutType() {
      const type = window.localStorage.getItem('chartLayoutType') as State["chartLayoutType"];
      if (type) {
        this.chartLayoutType = type;
      }
    },
    setLayoutType(type: State["chartLayoutType"]) {
      this.chartLayoutType = type;
      window.localStorage.setItem('chartLayoutType', type)
    }
  },
});
