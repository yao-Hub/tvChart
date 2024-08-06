import { defineStore } from "pinia";
import { useChartInit } from "./chartInit";
import { ResolutionString } from "public/charting_library/charting_library";
interface State {
  cacheAction: string;
}

export const useChartAction = defineStore("chartAction", {
  state: (): State => {
    return {
      // 即将执行的动作
      cacheAction: "",
    };
  },
  actions: {
    setCacheAction(action: string) {
      this.cacheAction = action;
    },
    clearCacheAction() {
      this.cacheAction = "";
    },
    
    // 改变周期
    changeResolution({
      id,
      resolution,
    }: {
      id?: string;
      resolution: ResolutionString;
    }) {
      const chartInitStore = useChartInit();
      const widget = chartInitStore.getChartWidget(id);
      widget?.onChartReady(() => {
        widget.activeChart().setResolution(resolution);
      });
    },
  },
});
