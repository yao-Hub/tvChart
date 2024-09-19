import { defineStore } from "pinia";
import { IChartingLibraryWidget, ResolutionString } from "public/charting_library";

interface State {
  chartWidgetList: {
    widget?: IChartingLibraryWidget;
    id: string;
    symbol?: string;
    interval?: ResolutionString;
  }[];
  loading: Boolean;
  mainId: string;
  chartLayoutType: "single" | "multiple";
  singleChartLoading: Record<string, boolean>;
  activeChartId: string;
  chartFlexDirection: "row" | "column"
}

export const useChartInit = defineStore("chartInit", {
  state: (): State => {
    return {
      chartWidgetList: [{ id: "chart_1" }],
      loading: true,
      mainId: "chart_1",
      chartLayoutType: "multiple",
      singleChartLoading: {},
      activeChartId: "chart_1",
      chartFlexDirection: "row",
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
          interval: widget.symbolInterval().interval,
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
    getChartWidgetListSymbol(id?: string) {
      if (this.chartWidgetList.length === 0) {
        throw new Error("chartWidget is null");
      }
      const findId = id || this.mainId;
      return this.chartWidgetList.find((e) => e.id === findId)?.symbol;
    },

    setChartWidgetListSymbolInterval(params: { id: string; symbol?: string, interval?: ResolutionString }) {
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
    changeChartWidgetSymbol(params: { id: string; symbol: string }) {
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

    // 图表的品种跟list的品种或者周期不匹配时，令图表的品种和周期更改为list的品种和周期
    syncSetChart() {
      this.chartWidgetList.forEach((item) => {
        this.singleChartLoading[item.id] = true;
        const widget = item.widget;
        const itemSymbol = item.symbol;
        const itemInterval = item.interval;
        itemSymbol && widget?.onChartReady(() => {
          widget.headerReady().then(() => {
            const nowSymbol = widget.symbolInterval().symbol;
            const nowInterval = widget.symbolInterval().interval;
            if (nowSymbol !== itemSymbol) {
              widget.activeChart().setSymbol(itemSymbol);
            }
            if (itemInterval && nowInterval !== itemInterval) {
              widget.activeChart().setResolution(itemInterval);
            }
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
    },
    intChartFlexDirection() {
      const type = window.localStorage.getItem('chartFlexDirection') as State["chartFlexDirection"];
      if (type) {
        this.chartFlexDirection = type;
      }
    },
    setChartFlexDirection(type: State["chartFlexDirection"]) {
      this.chartFlexDirection = type;
      window.localStorage.setItem('chartFlexDirection', type)
    }
  },
});
