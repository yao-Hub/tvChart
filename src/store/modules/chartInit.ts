import { defineStore } from 'pinia'
import { IChartingLibraryWidget } from 'public/charting_library/charting_library';

interface State {
  chartWidgetList: {
    widget: IChartingLibraryWidget
    id: string
    symbol: string
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
      this.chartWidgetList.push({ widget, id, symbol: widget.symbolInterval().symbol });
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
      this.chartWidgetList.splice(index, 1);
    },
    setChartSymbol() {
      this.chartWidgetList.forEach(item => {
        item.symbol = item.widget.symbolInterval().symbol;
      });
    },
    getChartSymbol(id?:string) {
      const findId = id || this.mainId;
      return this.chartWidgetList.find(e => e.id === findId)!.symbol;
    },
    setCacheSymbol(symbol:string, id?:string) {
      const findId = id || this.mainId;
      this.cacheSymbols[findId] = symbol;
    },
    getCacheSymbol(id?:string) {
      const findId = id || this.mainId;
      return this.cacheSymbols[findId];
    },
    clearCacheSymbol(id:string) {
      delete this.cacheSymbols[id];
    }
  }
})
