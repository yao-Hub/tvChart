import { defineStore } from 'pinia'
import { IChartingLibraryWidget } from 'public/charting_library/charting_library';

interface State {
  chartWidgetList: {
    widget: IChartingLibraryWidget
    id: string
  }[]
  loading: Boolean
  mainId: string
}

export const useChartInit = defineStore('chartInit', {
  state(): State {
    return {
      chartWidgetList: [],
      loading: false,
      mainId: ''
    }
  },
  actions: {
    setChartWidget(id: string, widget: IChartingLibraryWidget) {
      this.chartWidgetList?.push({ widget, id });
    },
    getChartWidget(id?: string) {
      if (this.chartWidgetList.length === 0) {
        throw new Error('chartWidget is null')
      }
      const findId = id || this.mainId;
      return this.chartWidgetList.find(e => e.id === findId)?.widget;
    },
  }
})
