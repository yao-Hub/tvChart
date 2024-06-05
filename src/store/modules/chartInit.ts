import { defineStore } from 'pinia'
import { IChartingLibraryWidget } from 'public/charting_library/charting_library';

interface State {
  chartWidget: IChartingLibraryWidget | null
}

const chartInitStore = defineStore('chartInitStore', {
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
export default chartInitStore
