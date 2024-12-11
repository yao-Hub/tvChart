import { useChartLine } from "@/store/modules/chartLine";
import { defineStore } from "pinia";
import {
  IChartingLibraryWidget,
  ResolutionString,
} from "public/charting_library";
import { reactive, ref, watch } from "vue";
import { useStorage } from "./storage";
import { useSymbols } from "./symbols";

interface State {
  chartWidgetList: {
    widget?: IChartingLibraryWidget;
    id: string;
    symbol: string;
    interval?: ResolutionString;
  }[];
  loading: Boolean;
  chartLayoutType: "single" | "multiple";
  chartLoading: Record<string, boolean>;
  activeChartId: string;
  chartFlexDirection: "row" | "column";
  globalRefresh: boolean;
}

export const useChartInit = defineStore("chartInit", () => {
  const symbolStore = useSymbols();
  const storageStore = useStorage();

  const state = reactive<State>({
    chartWidgetList: [],
    loading: true,
    chartLayoutType: "single",
    chartLoading: {},
    activeChartId: "chart_1",
    chartFlexDirection: "row",
    globalRefresh: false,
  });

  const activeChartSymbol = ref("");
  watch(
    () => [symbolStore.symbols, state.activeChartId],
    () => {
      const firstSymbol = symbolStore.symbols[0]?.symbol;
      const chartSymbol = getChartSymbol(state.activeChartId);
      activeChartSymbol.value = chartSymbol || firstSymbol;
    },
    { deep: true, immediate: true }
  );

  // 单图表显示工具栏 多图表隐藏
  watch(
    () => state.chartLayoutType,
    (type) => {
      state.chartWidgetList.forEach((item) => {
        if (item.widget) {
          const leftToolHidden = item.widget
            .activeChart()
            .getCheckableActionState("drawingToolbarAction");
          if (
            (type === "single" && !leftToolHidden) ||
            (type === "multiple" && leftToolHidden)
          ) {
            item.widget.activeChart().executeActionById("drawingToolbarAction");
          }
        }
      });
    }
  );

  // 刷新
  function refresh() {
    state.globalRefresh = true;
    setTimeout(() => {
      state.globalRefresh = false;
    }, 1000);
  }

  // 创建图表实例
  function createChartWidget(id: string, widget: IChartingLibraryWidget) {
    const index = state.chartWidgetList.findIndex((e) => e.id === id);
    const obj = {
      widget,
      id,
      symbol: widget.symbolInterval().symbol,
      interval: widget.symbolInterval().interval,
    };
    if (index === -1) {
      state.chartWidgetList.push(obj);
    } else {
      Object.assign(state.chartWidgetList[index], obj);
    }
  }

  // 获取图表实例
  function getChartWidget(id: string) {
    if (state.chartWidgetList.length === 0) {
      throw new Error("chartWidget is null");
    }
    return state.chartWidgetList.find((e) => e.id === id)?.widget;
  }

  // 移除chart实例
  function removeChartWidget(id: string) {
    if (state.chartWidgetList.length === 1) {
      return;
    }
    const index = state.chartWidgetList.findIndex((e) => e.id === id);

    state.chartWidgetList.splice(index, 1);
    const chartLineStore = useChartLine();
    chartLineStore.removeChartSub(id);

    setTimeout(() => {
      const firstChart = state.chartWidgetList[0];
      if (id === state.activeChartId) {
        state.activeChartId = firstChart.id;
      }
    });
  }

  // 增加一个图表
  function addChart(symbol?: string) {
    const ids = state.chartWidgetList.map((item) => +item.id.split("_")[1]);
    const minId = Math.min(...ids) as number;
    const maxId = Math.max(...ids) as number;
    const fullRange = new Set(
      [...Array(maxId - minId + 1).keys()].map((i) => i + minId)
    );
    const arrSet = new Set(ids);
    const missingIds = [...fullRange].filter((num) => !arrSet.has(num));
    const addId = missingIds.length ? missingIds[0] : maxId + 1;
    const id = `chart_${addId}`;
    state.chartWidgetList.push({
      id,
      symbol: symbol || activeChartSymbol.value,
    });
    state.activeChartId = id;
  }

  // 获取chart的symbol
  function getChartSymbol(id: string) {
    const symbol = state.chartWidgetList.find((e) => e.id === id)?.symbol;
    if (symbol) {
      return symbol;
    }
    return "";
  }

  // 设置chartWidgetList对象的品种 周期字段
  function setChartMapSymbolInterval(params: {
    id: string;
    symbol?: string;
    interval?: ResolutionString;
  }) {
    const { id, symbol, interval } = params;
    const targetItem = state.chartWidgetList.find((e) => e.id === id);
    if (targetItem && symbol) {
      targetItem.symbol = symbol;
    }
    if (targetItem && interval) {
      targetItem.interval = interval;
    }
  }

  // 设置图表显示品种
  function changeChartSymbol(params: { id: string; symbol: string }) {
    const { id, symbol } = params;
    const target = state.chartWidgetList.find((e) => e.id === id);
    if (target) {
      target.symbol = symbol;
      target.widget?.onChartReady(() => {
        target.widget?.headerReady().then(() => {
          target.widget?.activeChart()?.setSymbol(symbol);
        });
      });
    }
  }

  // 设置图表显示周期
  function changeChartInterval(params: {
    id: string;
    resolution: ResolutionString;
  }) {
    const { id, resolution } = params;
    const target = state.chartWidgetList.find((e) => e.id === id);
    if (target) {
      target.interval = resolution;
      target.widget?.onChartReady(() => {
        target.widget?.headerReady().then(() => {
          target.widget?.activeChart()?.setResolution(resolution);
        });
      });
    }
  }

  // 初始化图表布局（单个多个）
  function intLayoutType() {
    const type = storageStore.getItem("chartLayoutType");
    state.chartLayoutType = type || "single";

    const storageId = storageStore.getItem("activeChartId");
    if (storageId) {
      state.activeChartId = storageId;
    }
  }
  // 设置图表布局（单个多个）
  function setLayoutType(type: State["chartLayoutType"]) {
    state.chartLayoutType = type;
    storageStore.setItem("chartLayoutType", type);
  }
  // 初始化图表布局方向（row or column）
  function intChartFlexDirection() {
    const type = storageStore.getItem("chartFlexDirection");
    state.chartFlexDirection = type || "row";
  }
  // 设置图表布局方向（row or column）
  function setChartFlexDirection(type: State["chartFlexDirection"]) {
    state.chartFlexDirection = type;
    storageStore.setItem("chartFlexDirection", type);
  }

  // 保存图表状态
  function saveCharts() {
    try {
      const saveMap: Record<string, object> = {};
      state.chartWidgetList.forEach((item) => {
        item.widget?.save((state) => {
          saveMap[item.id] = state;
        });
      });
      const saveChatList = state.chartWidgetList.map((item) => {
        const { id, symbol, interval } = item;
        return {
          id,
          symbol,
          interval,
        };
      });
      storageStore.setItem("chartList", saveChatList);
      storageStore.setItem("chartInfoMap", saveMap);
      storageStore.setItem("activeChartId", state.activeChartId);
    } catch (error) {
      console.log("saveChart error", error);
    }
  }

  // 加载图表个数
  function loadChartList() {
    let result = [{ id: "chart_1", symbol: activeChartSymbol.value }];
    const wList = storageStore.getItem("chartList");
    if (wList && wList.length) {
      result = wList;
    }
    state.chartWidgetList = result;
  }
  function getChartSavedData(id: string) {
    const sMap = storageStore.getItem("chartInfoMap");
    if (sMap) {
      return sMap[id];
    }
  }
  // 加载图表最后的操作形态
  function loadCharts(id?: string) {
    const sMap = storageStore.getItem("chartInfoMap");
    if (sMap) {
      if (id) {
        const found = state.chartWidgetList.find((e) => e.id === id);
        if (found) found.widget?.load(sMap[id]);
        return;
      }
      state.chartWidgetList.forEach((item) => {
        if (sMap[item.id]) {
          item.widget?.load(sMap[item.id]);
        }
      });
    }
  }

  return {
    state,
    refresh,
    createChartWidget,
    getChartWidget,
    removeChartWidget,
    addChart,
    getChartSymbol,
    setChartMapSymbolInterval,
    changeChartSymbol,
    changeChartInterval,
    intLayoutType,
    setLayoutType,
    intChartFlexDirection,
    setChartFlexDirection,
    saveCharts,
    loadChartList,
    getChartSavedData,
    loadCharts,
    activeChartSymbol,
  };
});
