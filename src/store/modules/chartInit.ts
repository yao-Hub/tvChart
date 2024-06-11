import { defineStore } from 'pinia'
import { IChartingLibraryWidget } from 'public/charting_library/charting_library';

interface State {
  chartWidget: IChartingLibraryWidget | null
  loading: Boolean
}

export const useChartInit = defineStore('chartInit', {
  state(): State {
    return {
      chartWidget: null,
      loading: false
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
