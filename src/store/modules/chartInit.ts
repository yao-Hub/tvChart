import { defineStore } from 'pinia'
import { IChartingLibraryWidget } from 'public/charting_library/charting_library';
import { nextTick } from 'vue';

interface State {
  chartWidgetList: {
    widget?: IChartingLibraryWidget
    id: string
    symbol?: string
  }[]
  loading: Boolean
  mainId: string
  chartLayoutType: 'single' | 'multiple'
  cacheSymbols: Record<string, string>
}

export const useChartInit = defineStore('chartInit', {
  state(): State {
    return {
      chartWidgetList: [],
      loading: false,
      mainId: '',
      chartLayoutType: 'single',
      cacheSymbols: {}
    }
  },
  actions: {
    setChartWidget(id: string, widget: IChartingLibraryWidget) {
      const foundChart = this.chartWidgetList.find(e => e.id === id);
      if (!foundChart) {
        this.chartWidgetList.push({ widget, id, symbol: widget.symbolInterval().symbol });
      }
      if (foundChart) {
        if (!foundChart.widget) {
          foundChart.widget = widget;
        }
        if (!foundChart.symbol) {
          foundChart.symbol = widget.symbolInterval().symbol ;
        }
      }
    },
    getChartWidget(id?: string) {
      if (this.chartWidgetList.length === 0) {
        throw new Error('chartWidget is null')
      }
      const findId = id || this.mainId;
      return this.chartWidgetList.find(e => e.id === findId)?.widget;
    },
    removeChartWidget(id:string) {
      const index = this.chartWidgetList.findIndex(e => e.id === id);
      if (index > -1) {
        this.chartWidgetList.splice(index, 1);
      }
    },
    setChartSymbol(params?: {id: string, symbol: string}) {
      if (params) {
        const {id, symbol} = params;
        const find = this.chartWidgetList.find(e => e.id === id);
        if (find) {
          find.symbol = symbol
        }
        return;
      }
      this.chartWidgetList.forEach(item => {
        if (item.widget) {
          item.widget.onChartReady(() => {
            item.widget?.headerReady().then(() => {
              item.symbol = item.widget?.activeChart().symbol() || '';
            });
          });
        }
      });
    },
    setCacheSymbol(params?: {symbol: string, id: string}) {
      if (params) {
        const {id, symbol} = params;
        this.cacheSymbols[id] = symbol;
      } else {
        this.chartWidgetList.forEach(item => {
          if (item.widget) {
            item.widget.onChartReady(() => {
              item.widget?.headerReady().then(() => {
                const symbol = item.widget?.activeChart().symbol();
                if (symbol) {
                  this.cacheSymbols[item.id] = symbol;
                }
              });
            });
          }
        })
      }
    },

    // 根据缓存的品种设置当前品种
    async setChartSymbolWithCache(id?: string) {
      await nextTick();
      if (id) {
        const cacheSymbol = this.cacheSymbols[id];
        if (cacheSymbol) {
          const widget = this.chartWidgetList.find(e => e.id === id)?.widget;
          widget?.onChartReady(() => {
            widget.headerReady().then(() => {
              widget.activeChart().setSymbol(cacheSymbol);
            });
          });
        }
        return;
      }
      this.chartWidgetList.forEach(item => {
        const cacheSymbol = this.cacheSymbols[item.id];
        if (cacheSymbol && item.widget) {
          item.widget.onChartReady(() => {
            item.widget?.headerReady().then(() => {
              item.widget?.activeChart().setSymbol(cacheSymbol);
            });
          });
        }
      })
    },
    clearCacheSymbol(id:string) {
      delete this.cacheSymbols[id];
    }
  }
})
