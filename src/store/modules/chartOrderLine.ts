import { computed, reactive, ref, watch } from "vue";
import { defineStore } from "pinia";

import * as Library from "public/charting_library";
import { resOrders, reqEditOpeningOrders } from "api/order/index";
import { getTradingDirection } from "utils/order/index";
import { hexToRGBA } from "utils/common";
import eventBus from "@/utils/eventBus";

import { useChartInit } from "./chartInit";
import { useOrder } from "./order";
import { useTheme } from "./theme";
import { useDialog } from "./dialog";

interface IMarketLineItem {
  line: Library.IPositionLineAdapter;
  orderInfo: resOrders;
}

interface IOrderItem {
  line: Library.IOrderLineAdapter;
  orderInfo: resOrders;
}

interface ILineState {
  marketLines: Record<string, IMarketLineItem[]>;
  pendingLines: Record<string, IOrderItem[]>;
  slLines: Record<string, IOrderItem[]>;
  tpLines: Record<string, IOrderItem[]>;
}

type LineType = "market" | "tp" | "sl" | "pending";
type LineAdapter = Library.IPositionLineAdapter | Library.IOrderLineAdapter;

// 通用配置接口
interface LineDrawConfig {
  lineType: LineType;
  getPrice: (order: resOrders) => number;
  createLine: (chart: Library.IChartingLibraryWidget) => LineAdapter;
  getText: (order: resOrders) => string;
  shouldDraw: (order: resOrders) => boolean;
  setupLine: (line: LineAdapter, order: resOrders) => void;
  shouldUpdate: (oldOrder: resOrders, newOrder: resOrders) => boolean;
  updateLine?: (line: LineAdapter, order: resOrders) => void;
}

export const useChartOrderLine = defineStore("chartOrderLine", () => {
  const chartInitStore = useChartInit();
  const orderStore = useOrder();
  const themeStore = useTheme();
  const dialogStore = useDialog();

  const lineState = reactive<ILineState>({
    marketLines: {},
    pendingLines: {},
    slLines: {},
    tpLines: {},
  });

  // 行为集合
  const actionMap = ref<Map<string, boolean>>(new Map());

  // 可以编辑的线id
  const cantEditLineId = ref<number | null>(null);

  const chartsLoaded = computed(() => chartInitStore.state.ifChartLoaded);
  const chartList = computed(() => chartInitStore.state.chartWidgetList);
  const marketOrder = computed(() => orderStore.state.orderData.marketOrder);
  const pendingOrder = computed(() => orderStore.state.orderData.pendingOrder);
  const marketOrderHistory = computed(
    () => orderStore.state.orderData.marketOrderHistory
  );

  const colors = computed(() => {
    const downColor = themeStore.getUpDownColor("downHoverColor");
    const upColor = themeStore.getUpDownColor("upHoverColor");
    const upHoverColor = hexToRGBA(upColor, 0.5);
    const downHoverColor = hexToRGBA(downColor, 0.5);
    return {
      downColor,
      upColor,
      upHoverColor,
      downHoverColor,
    };
  });

  watch(
    () => themeStore.upDownTheme,
    () => changeEditType(null, null, false)
  );

  watch(
    () => [marketOrder.value, chartsLoaded.value],
    () => {
      for (const i in chartsLoaded.value) {
        if (chartsLoaded.value[i]) {
          drawMarketOrderLine(i);
          drawTpLine(i);
          drawSlLine(i);
        }
      }
    },
    { deep: true }
  );

  watch(
    () => [pendingOrder, chartsLoaded.value],
    () => {
      for (const i in chartsLoaded.value) {
        if (chartsLoaded.value[i]) {
          drawPendingOrderLine(i);
        }
      }
    },
    {
      deep: true,
    }
  );

  watch(
    () => [marketOrderHistory, chartsLoaded.value],
    () => {
      for (const i in chartsLoaded.value) {
        if (chartsLoaded.value[i]) {
          drawTradeFlag(i);
          drawTradeHistory(i);
        }
      }
    },
    {
      deep: true,
    }
  );

  const actionCount = ref(0);
  eventBus.on("chartMouseUp", () => {
    const oldActionCount = actionCount.value;
    setTimeout(() => {
      if (oldActionCount === actionCount.value && cantEditLineId.value) {
        changeEditType(null, null, false);
        cantEditLineId.value = null;
      }
    }, 200);
  });

  // 设置线颜色
  const setColor = (
    lineType: LineType,
    orderType: number,
    line: LineAdapter,
    ifEdit: boolean = false
  ) => {
    const colorMap = {
      sell: ifEdit ? colors.value.downColor : colors.value.downHoverColor,
      buy: ifEdit ? colors.value.upColor : colors.value.upHoverColor,
    };
    const direction = getTradingDirection(orderType);
    const color = colorMap[direction];

    const transparent = "rgba(0, 0, 0, 0)";
    line
      // 水平线
      .setLineColor(color)
      // 主体
      .setBodyBackgroundColor(color)
      // 保护持仓
      .setQuantityBackgroundColor(color)
      .setQuantityBorderColor(transparent)
      .setBodyBorderColor(transparent);

    if (lineType === "market") {
      // 平仓反手
      (line as Library.IPositionLineAdapter)
        .setReverseButtonBackgroundColor(color)
        .setReverseButtonBorderColor(transparent)
        // 关闭持仓
        .setCloseButtonBorderColor(transparent);
    }
  };

  // 通用绘制函数
  const drawGenericLines = (
    chartId: string,
    orders: resOrders[],
    stateLines: Record<string, { line: LineAdapter; orderInfo: resOrders }[]>,
    config: LineDrawConfig
  ) => {
    const chart = chartList.value.find((e) => e.id === chartId);
    if (!chart || !chart.widget) return;

    // 初始化存储空间
    if (!stateLines[chartId]) stateLines[chartId] = [];
    const chartLines = stateLines[chartId];

    const activeOrderIds = new Set<string>();
    const existingLinesMap = new Map<string, (typeof chartLines)[0]>();

    // 创建现有线条映射
    chartLines.forEach((lineItem) => {
      existingLinesMap.set(lineItem.orderInfo.id.toString(), lineItem);
    });

    // 处理有效订单
    orders.filter(config.shouldDraw).forEach((order) => {
      const orderId = order.id.toString();
      activeOrderIds.add(orderId);

      if (!existingLinesMap.has(orderId)) {
        // 创建新线条
        const line = config.createLine(chart.widget!);
        line
          .setBodyTextColor("#fff")
          .setPrice(config.getPrice(order))
          .setText(config.getText(order))
          .setLineLength(10);

        config.setupLine(line, order);
        setColor(
          config.lineType,
          order.type,
          line,
          order.id === cantEditLineId.value
        );

        chartLines.push({ line, orderInfo: { ...order } });
      } else {
        // 更新现有线条
        const target = chartLines.find(
          (item) => item.orderInfo.id === order.id
        );
        if (target) {
          if (config.shouldUpdate(target.orderInfo, order)) {
            target.line.setText(config.getText(order));
            if (config.updateLine) {
              config.updateLine(target.line, order);
            }
          }
          target.orderInfo = { ...order };
        }
      }
    });

    // 清理无效线条
    for (let i = chartLines.length - 1; i >= 0; i--) {
      const lineItem = chartLines[i];
      const orderId = lineItem.orderInfo.id.toString();

      if (!activeOrderIds.has(orderId)) {
        lineItem.line.remove();
        chartLines.splice(i, 1);
      }
    }
  };

  // 获取最新的order信息
  const getLatestOrder = (
    chartId: string,
    lineType: LineType,
    orderId: number
  ): resOrders | null => {
    const stateKey = `${lineType}Lines` as keyof ILineState;
    const lines = lineState[stateKey][chartId];
    if (!lines) return null;

    const lineItem = lines.find((item) => item.orderInfo.id === orderId);
    return lineItem ? lineItem.orderInfo : null;
  };

  // 检查是否编辑状态
  const checkAndSetEditState = (chartId: string, orderId: number): boolean => {
    if (cantEditLineId.value !== orderId) {
      changeEditType(chartId, orderId, true);
      cantEditLineId.value = orderId;
      return true;
    }
    return false;
  };

  // 更改编辑状态
  const changeEditType = (
    chartId: string | null,
    orderId: number | null,
    ifEdit: boolean
  ) => {
    const allList: Array<{
      line: LineAdapter;
      orderInfo: resOrders;
      stateKey: LineType;
    }> = [];
    const formatList = (
      list: {
        line: LineAdapter;
        orderInfo: resOrders;
      }[],
      stateKey: LineType
    ) => {
      const result = list.map((item) => {
        return {
          ...item,
          stateKey,
        };
      });
      return result;
    };
    for (const i in lineState) {
      const key = i as keyof ILineState;
      const stateKey = key.replace("Lines", "") as LineType;
      if (chartId) {
        const list = lineState[key][chartId];
        if (list) {
          const targetList = formatList(list, stateKey);
          allList.push(...targetList);
        }
      } else {
        Object.values(lineState[key]).forEach((list) => {
          const targetList = formatList(list, stateKey);
          allList.push(...targetList);
        });
      }
    }
    allList.forEach((item) => {
      if (orderId) {
        setColor(
          item.stateKey,
          item.orderInfo.type,
          item.line,
          orderId === item.orderInfo.id ? ifEdit : false
        );
      } else {
        setColor(item.stateKey, item.orderInfo.type, item.line, ifEdit);
      }
    });
  };

  // 市价单绘制
  const drawMarketOrderLine = (chartId: string) => {
    const chart = chartList.value.find((e) => e.id === chartId);
    if (!chart) return;

    drawGenericLines(
      chartId,
      marketOrder.value.filter((order) => order.symbol === chart.symbol),
      lineState.marketLines,
      {
        lineType: "market",
        getPrice: (order) => order.open_price,
        getText: (order) => {
          const positionType = order.type === 1 ? "多头持仓" : "空头持仓";
          return `${order.id} ${positionType} 盈亏：${order.profit} sl: ${order.sl_price} tp: ${order.tp_price}`;
        },
        shouldDraw: () => true,
        createLine: (widget) => widget.chart().createPositionLine(),
        setupLine: (line, order) => {
          const direction = getTradingDirection(order.type);
          const revBtnIconColor =
            direction === "buy" ? colors.value.downColor : colors.value.upColor;
          const marketLine = line as Library.IPositionLineAdapter;

          marketLine
            .setReverseButtonIconColor(revBtnIconColor)
            .setQuantity((order.volume / 100).toString())
            .onReverse(order, () => {
              actionCount.value++;
              if (checkAndSetEditState(chartId, order.id)) return;
              const currentOrder = getLatestOrder(chartId, "market", order.id);
              if (!currentOrder) return;
              handleMarketAction("reverse", null, order, marketLine);
            })
            .onClose(order, () => {
              actionCount.value++;
              if (checkAndSetEditState(chartId, order.id)) return;
              const currentOrder = getLatestOrder(chartId, "market", order.id);
              if (!currentOrder) return;
              handleMarketAction("close", chartId, currentOrder, marketLine);
            })
            .onModify(order, () => {
              actionCount.value++;
              if (checkAndSetEditState(chartId, order.id)) return;
              const currentOrder = getLatestOrder(chartId, "market", order.id);
              if (!currentOrder) return;
              orderStore.state.editOrderInfo = currentOrder;
              dialogStore.openDialog("marketOrderEditVisible");
            });
        },
        shouldUpdate: (oldOrder, newOrder) => {
          return oldOrder.profit !== newOrder.profit;
        },
      }
    );
  };

  // 止盈止损绘制
  type TDrwaLineType = "tp" | "sl";
  const drawPriceLine = (lineType: TDrwaLineType, chartId: string) => {
    const chart = chartList.value.find((e) => e.id === chartId);
    if (!chart) return;

    const fieldMap: Record<TDrwaLineType, keyof resOrders> = {
      tp: "tp_price",
      sl: "sl_price",
    };
    const field = fieldMap[lineType];

    const stateLinesMap = {
      tp: lineState.tpLines,
      sl: lineState.slLines,
    };
    const stateLines = stateLinesMap[lineType];

    drawGenericLines(
      chartId,
      marketOrder.value.filter(
        (order) => order.symbol === chart.symbol && order[field]
      ),
      stateLines,
      {
        lineType,
        getPrice: (order) => +order[field]!,
        getText: (order) => `${lineType.toUpperCase()}: ${order[field]}`,
        shouldDraw: (order) => !!order[field],
        createLine: (widget) => widget.chart().createOrderLine(),
        setupLine: (line, order) => {
          const currentLine = line as Library.IOrderLineAdapter;
          currentLine
            .setLineStyle(2)
            .setQuantity((order.volume / 100).toString())
            .onModify(() => {
              actionCount.value++;
              if (checkAndSetEditState(chartId, order.id)) return;
              const currentOrder = getLatestOrder(chartId, "market", order.id);
              if (!currentOrder) return;
              orderStore.state.editOrderInfo = { ...currentOrder };
              dialogStore.openDialog("marketOrderEditVisible");
            })
            .onCancel(async () => {
              actionCount.value++;
              if (checkAndSetEditState(chartId, order.id)) return;
              const currentOrder = getLatestOrder(chartId, "market", order.id);
              if (!currentOrder) return;
              marketEditSlTp({
                order: currentOrder,
                updataKey: lineType,
                updataValue: 0,
                line: currentLine,
              });
            })
            .onMove(() => {
              actionCount.value++;
              checkAndSetEditState(chartId, order.id);
              const currentOrder = getLatestOrder(chartId, "market", order.id);
              if (!currentOrder) return;
              marketEditSlTp({
                order: currentOrder,
                updataKey: lineType,
                updataValue: line.getPrice(),
                line: currentLine,
              });
            });
        },
        shouldUpdate: (oldOrder, newOrder) => {
          return (
            oldOrder.tp_price !== newOrder.tp_price ||
            oldOrder.sl_price !== newOrder.sl_price
          );
        },
        updateLine: (line, order) => {
          line.setPrice(lineType === "tp" ? order.tp_price : order.sl_price);
        },
      }
    );
  };

  // 绘制止盈线
  const drawTpLine = (chartId: string) => drawPriceLine("tp", chartId);

  // 绘制止损线
  const drawSlLine = (chartId: string) => drawPriceLine("sl", chartId);

  // 绘制挂单线
  const drawPendingOrderLine = (chartId: string) => {
    const chart = chartList.value.find((e) => e.id === chartId);
    if (!chart) return;
  };

  // 绘制交易标记
  const drawTradeFlag = (chartId: string) => {};

  // 绘制交易历史
  const drawTradeHistory = (chartId: string) => {};

  // 市价单反向持仓 /  市价单关闭
  const handleMarketAction = async (
    type: "reverse" | "close",
    chartId: string | null,
    order: resOrders,
    line: Library.IPositionLineAdapter
  ) => {
    const actionId = `${order.id}@Market_${type}`;

    // 防止重复操作
    if (actionMap.value.get(actionId)) return;
    actionMap.value.set(actionId, true);

    const ifOne = orderStore.state.ifOne;
    try {
      if (ifOne) {
        // 操作前视觉反馈
        line.setLineColor("rgba(128,128,128,0.5)");

        if (type === "reverse") {
          await orderStore.addMarket("reverse");
        } else if (type === "close") {
          await orderStore.delMarketOrder({
            ...order,
            volume: order.volume / 100,
          });

          // 关闭后立即删除订单线
          if (chartId) {
            const chartLines = lineState.marketLines[chartId];
            const index = chartLines?.findIndex(
              (item) => item.orderInfo.id === order.id
            );
            if (index !== -1 && index !== undefined) {
              const lineItem = chartLines[index];
              lineItem.line.remove();
              chartLines.splice(index, 1);
            }
          }
        }
      } else if (ifOne === null) {
        dialogStore.openDialog("disclaimersVisible");
      } else {
        // 非一键模式，打开确认对话框
        orderStore.state.marketConfirmInfo.type = type;
        orderStore.state.marketConfirmInfo.volume = order.volume / 100;
        orderStore.state.editOrderInfo = { ...order };
        dialogStore.openDialog("marketOrderComfirmVisible");
      }
    } catch (error) {
      // 操作失败恢复颜色
      setColor("market", order.type, line);
    } finally {
      actionMap.value.delete(actionId);
    }
  };

  interface IMarketEditSlTpParmas {
    order: resOrders;
    updataKey: "sl" | "tp";
    updataValue: number;
    line: Library.IOrderLineAdapter;
  }
  // 市价单止盈止损
  const marketEditSlTp = async (params: IMarketEditSlTpParmas) => {
    const { order, updataKey, updataValue, line } = params;
    const actionId = `${order.id}@MarketModify_${updataKey}`;
    if (actionMap.value.get(actionId)) return;
    actionMap.value.set(actionId, true);
    try {
      const ifOne = orderStore.state.ifOne;
      if (ifOne) {
        const { symbol, id } = order;
        const updata: reqEditOpeningOrders = {
          symbol,
          id,
        };
        updata[updataKey] = updataValue;
        await orderStore.modifyMarketOrder(updata, order);
        // 直接删除线和数据
        if (updataValue === 0) {
          const chartLines = lineState[`${updataKey}Lines`];
          Object.keys(chartLines).forEach((key) => {
            chartLines[key] = chartLines[key].filter(
              (item) => item.orderInfo.id !== id
            );
          });
          line.remove();
          return;
        }
        line.setText(`${updataKey}: ${updataValue}`);
      } else if (ifOne === null) {
        dialogStore.openDialog("disclaimersVisible");
      } else {
        orderStore.state.editOrderInfo = {
          ...order,
          [`${updataKey}_price`]: updataValue,
        };
        dialogStore.openDialog("marketOrderEditVisible");
      }
    } catch {
      line.setPrice(order[`${updataKey}_price`]);
    } finally {
      actionMap.value.delete(actionId);
    }
  };

  const $reset = () => {
    Object.entries(lineState.marketLines).forEach(([chartId, lines]) => {
      lines.forEach((item) => item.line.remove());
      lineState.marketLines[chartId] = [];
    });

    lineState.marketLines = {};
    lineState.pendingLines = {};
    lineState.slLines = {};
    lineState.tpLines = {};
  };

  return {
    lineState,
    $reset,
  };
});
