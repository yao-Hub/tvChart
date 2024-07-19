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
}

export const useChartInit = defineStore('chartInit', {
  state(): State {
    return {
      chartWidgetList: [],
      loading: false,
      mainId: '',
      chartLayoutType: 'single'
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
    }
  }
})
