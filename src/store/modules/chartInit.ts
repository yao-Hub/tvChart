import { defineStore } from 'pinia'
import { widget, IChartingLibraryWidget } from 'public/charting_library/charting_library';

interface State {
  chartWidget: IChartingLibraryWidget | null
}

export const useChartInit = defineStore('chartInit', {
  state(): State {
    return {
      chartWidget: null,
    }
  },
  actions: {
    getChartWidget() {
      if (!this.chartWidget) {
        throw new Error('chartWidget is null')
      }
      return this.chartWidget;
    },
  }
})
