import { useChartLine } from "@/store/modules/chartLine";
import { defineStore } from "pinia";
import {
  IChartingLibraryWidget,
  ResolutionString,
} from "public/charting_library";
import { CSSProperties, computed, reactive, watch } from "vue";
import { useSocket } from "./socket";
import { useStorage } from "./storage";
import { useSymbols } from "./symbols";

interface IChart {
  widget?: IChartingLibraryWidget;
  id: string;
  symbol: string;
  interval?: ResolutionString;
}
interface IState {
  chartWidgetList: IChart[];
  chartLayoutType: "single" | "multiple" | "row" | "column";
  loading: Boolean; // 整个图表区域的加载
  chartLoading: Record<string, boolean>; // 各个图表的加载状态
  activeChartId: string; // 当前激活的chart
  globalRefresh: 0 | 1; // 是否全局刷新
  ifFinishLoad: Record<string, boolean>; // 图表是否渲染完成
  chartFreshKeys: Record<string, number>; // 图表刷新
}

export const useChartInit = defineStore("chartInit", () => {
  const symbolStore = useSymbols();
  const storageStore = useStorage();
  const socketStore = useSocket();

  const chartMaxLength = 9;

  const state = reactive<IState>({
    chartWidgetList: [],
    loading: true,
    chartLayoutType: "single",
    chartLoading: {},
    activeChartId: "chart_1",
    globalRefresh: 0,
    ifFinishLoad: {},
    chartFreshKeys: {},
  });

  const chartStyles = computed(() => {
    const text = state.chartLayoutType.match(/row|column/);
    if (text) {
      const flowX = text[0] === "row" ? "auto" : "hidden";
      const flowY = text[0] === "column" ? "auto" : "hidden";
      const result = {
        flexDirection: text[0] as CSSProperties["flexDirection"],
        flexWrap: "nowrap" as CSSProperties["flexWrap"],
        overflowX: flowX as CSSProperties["overflowX"],
        overflowY: flowY as CSSProperties["overflowY"],
      };
      return result;
    }
  });

  // 等待图表初始化完毕才去初始化socket
  watch(
    () => state.ifFinishLoad,
    () => {
      const ifEnding = ifAllChartLoadingEnd();
      if (ifEnding && socketStore.socket === null) {
        socketStore.initSocket();
      }
    },
    { deep: true }
  );

  // 单图表显示工具栏 多图表隐藏
  watch(
    () => [state.chartLayoutType, state.chartWidgetList.length],
    ([type, length]) => {
      try {
        state.chartWidgetList.forEach((item) => {
          if (item.widget) {
            const leftToolHidden = item.widget
              .activeChart()
              .getCheckableActionState("drawingToolbarAction");
            if (
              (type === "single" && !leftToolHidden) ||
              (type !== "single" && leftToolHidden) ||
              (length === 1 && !leftToolHidden)
            ) {
              item.widget
                .activeChart()
                .executeActionById("drawingToolbarAction");
            }
          }
        });
      } catch (e) {}
    }
  );

  function chartRefresh(id?: string) {
    if (id) {
      state.chartFreshKeys[id] = +!state.chartFreshKeys[id];
    } else {
      for (const i in state.chartFreshKeys) {
        state.chartFreshKeys[i] = +!state.chartFreshKeys[i];
      }
    }
  }

  // 系统刷新
  function systemRefresh() {
    state.globalRefresh = state.globalRefresh ? 0 : 1;
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
    setTimeout(() => saveCharts());
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

    const firstChart = state.chartWidgetList[0];
    if (id === state.activeChartId) {
      state.activeChartId = firstChart.id;
    }

    delete state.ifFinishLoad[id];

    // 移除渲染
    const subscribed = chartLineStore.subscribed;
    for (const ID in subscribed) {
      const chartId = ID.split("@")[0];
      if (chartId === id) {
        chartLineStore.unsubscribed(ID);
      }
    }
    saveCharts();
  }

  // 增加一个图表
  function addChart(symbol?: string) {
    if (state.chartWidgetList.length >= chartMaxLength) {
      return;
    }
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
    const activeSymbol = getDefaultSymbol();
    state.chartWidgetList.push({
      id,
      symbol: symbol || activeSymbol,
    });
    state.activeChartId = id;
  }

  // 获取chart的symbol
  function getChartSymbol(id: string) {
    const target = state.chartWidgetList.find((e) => e.id === id);
    if (target) {
      return target.symbol;
    }
    if (symbolStore.symbolsTradeAllow.length) {
      return symbolStore.symbolsTradeAllow[0].symbol;
    }
    return "";
  }

  // 默认商品（初始化的商品）
  function getDefaultSymbol() {
    const chartSymbol = getChartSymbol(state.activeChartId);
    const tradeSymbols = [...symbolStore.symbolsTradeAllow];
    const index = tradeSymbols.findIndex((e) => e.symbol === chartSymbol);
    if (chartSymbol && index > -1) {
      return chartSymbol;
    }
    if (tradeSymbols.length) {
      const canTradeCharts = tradeSymbols.filter(
        (item) =>
          state.chartWidgetList.findIndex((e) => e.symbol === item.symbol) > -1
      );
      if (canTradeCharts.length) {
        return canTradeCharts[0].symbol;
      }
      return tradeSymbols[0].symbol;
    }
    return "";
  }

  // 设置图表显示商品
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

  // 初始化图表布局
  function intLayoutType() {
    const type = storageStore.getItem("chartLayoutType");
    state.chartLayoutType = type || "single";
    const storageId = storageStore.getItem("activeChartId") || "chart_1";
    state.activeChartId = storageId;
  }
  // 设置图表布局
  function setLayoutType(type: IState["chartLayoutType"]) {
    state.chartLayoutType = type;
    storageStore.setItem("chartLayoutType", type);
  }

  // 保存图表状态
  function saveCharts() {
    try {
      const saveMap: Record<string, object> = {};
      state.chartWidgetList.forEach((item) => {
        saveMap[item.id] = {};
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
      if (saveChatList.length) {
        storageStore.setItem("chartList", saveChatList);
      }
      if (Object.keys(saveMap).length) {
        storageStore.setItem("chartInfoMap", saveMap);
      }
      storageStore.setItem("activeChartId", state.activeChartId);
    } catch (error) {
      console.log(error);
    }
  }

  // 加载图表个数
  function loadChartList() {
    const activeSymbol = getDefaultSymbol();
    let result = [
      {
        id: "chart_1",
        symbol: activeSymbol,
        interval: "60" as ResolutionString,
      },
    ];
    const wList = storageStore.getItem("chartList");
    if (wList && wList.length) {
      wList.forEach((item: IChart) => {
        const index = symbolStore.symbols.findIndex(
          (e) => e.symbol === item.symbol
        );
        if (index === -1) {
          item.symbol = activeSymbol;
          const infoMap = storageStore.getItem("chartInfoMap");
          if (infoMap && infoMap[item.id]) {
            delete infoMap[item.id];
          }
          storageStore.setItem("chartInfoMap", infoMap);
        }
      });
      result = wList;
    }
    state.chartWidgetList = result;
  }
  function getChartSavedData(id: string) {
    const sMap = storageStore.getItem("chartInfoMap");
    if (sMap) {
      return sMap[id] || null;
    }
    return null;
  }

  // 全部图表是否都加载完毕
  const ifAllChartLoadingEnd = () => {
    const values = Object.values(state.ifFinishLoad);
    const ifNoDone = values.some((e) => !e);
    return values.length > 0 && !ifNoDone;
  };
  function setChartLoadingEndType(id: string, ifFinish: boolean) {
    state.ifFinishLoad[id] = ifFinish;
  }

  function $reset() {
    state.chartWidgetList = [];
    state.chartLayoutType = "single";
    state.chartLoading = {};
    state.activeChartId = "chart_1";
    state.ifFinishLoad = {};
    state.chartFreshKeys = {};
  }

  return {
    state,
    chartMaxLength,
    chartStyles,
    chartRefresh,
    systemRefresh,
    createChartWidget,
    getChartWidget,
    removeChartWidget,
    addChart,
    getChartSymbol,
    changeChartSymbol,
    changeChartInterval,
    intLayoutType,
    setLayoutType,
    saveCharts,
    loadChartList,
    getChartSavedData,
    getDefaultSymbol,
    setChartLoadingEndType,
    $reset,
  };
});
