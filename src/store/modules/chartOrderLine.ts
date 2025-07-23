import { computed, reactive, ref, watch } from "vue";
import { defineStore } from "pinia";

import i18n from "@/language/index";
import eventBus from "@/utils/eventBus";
import { getTradingDirection } from "utils/order/index";
import { hexToRGBA } from "utils/common";
import { orderTypeOptions } from "@/constants/common";

import * as Library from "public/charting_library";
import {
  resOrders,
  reqEditOpeningOrders,
  resPendingOrders,
  reqPendingOrdersAdd,
} from "api/order/index";

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

interface IHistoryItem {
  shape: Library.IExecutionLineAdapter;
  orderInfo: resOrders;
  type: "open" | "close";
}

interface ILineState {
  marketLines: Record<string, IMarketLineItem[]>;
  pendingLines: Record<string, IOrderItem[]>;
  slLines: Record<string, IOrderItem[]>;
  tpLines: Record<string, IOrderItem[]>;
  historyLines: Record<string, IHistoryItem[]>;
}

type LineType = "market" | "tp" | "sl" | "pending";
type LineAdapter = Library.IPositionLineAdapter | Library.IOrderLineAdapter;

// 通用配置接口
interface LineDrawConfig {
  lineType: LineType; // 线类别
  getPrice: (order: resOrders & { order_price_time?: number }) => number; // 线价格位
  createLine: (chart: Library.IChartingLibraryWidget) => LineAdapter; // 创建何种线
  getText: (order: resOrders) => string; // 主体显示文字
  shouldDraw: (order: resOrders) => boolean; // 绘制条件
  setupLine: (line: LineAdapter, order: resOrders) => void; // 额外的线操作
  shouldUpdate: (oldOrder: resOrders, newOrder: resOrders) => boolean; // 何时更新线信息
  updateLine?: (line: LineAdapter, order: resOrders) => void; // 更新线什么信息
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
    historyLines: {},
  });

  // 行为集合
  const actionMap = ref<Map<string, boolean>>(new Map());

  // 可以编辑的线id
  const cantEditLineId = ref<number | null>(null);

  // 图表加载完毕状态集合
  const chartsLoaded = computed(() => chartInitStore.state.ifChartLoaded);
  // 所有图表列表
  const chartList = computed(() => chartInitStore.state.chartWidgetList);
  // 持仓列表
  const marketOrder = computed(() => orderStore.state.orderData.marketOrder);
  // 挂单列表
  const pendingOrder = computed(() => orderStore.state.orderData.pendingOrder);
  // 交易历史列表
  const marketOrderHistory = computed(
    () => orderStore.state.orderData.marketOrderHistory
  );

  // 颜色映射
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

  // 全局热更新先初始化
  watch(
    () => useChartInit().state.globalRefresh,
    () => $reset()
  );

  // 当改变红涨颜色调整也要调整对应的线颜色
  watch(
    () => themeStore.upDownTheme,
    () => changeEditType(null, null, false)
  );

  // 监听持仓单变化和图表加载状态
  watch(
    () => [marketOrder.value, chartsLoaded.value],
    () => {
      for (const i in chartsLoaded.value) {
        if (chartsLoaded.value[i]) {
          drawMarketOrderLine(i);
          drawPriceLine("tp", i);
          drawPriceLine("sl", i);
        }
      }
    },
    { deep: true }
  );

  // 监听挂单变化和图表加载状态
  watch(
    () => [pendingOrder, chartsLoaded.value],
    () => {
      for (const i in chartsLoaded.value) {
        if (chartsLoaded.value[i]) {
          drawPendingOrderLine(i);
          drawPriceLine("tp", i, "pending");
          drawPriceLine("sl", i, "pending");
        }
      }
    },
    {
      deep: true,
    }
  );

  // 监听交易历史和图表加载状态
  watch(
    () => [marketOrderHistory, chartsLoaded.value],
    () => {
      for (const i in chartsLoaded.value) {
        if (chartsLoaded.value[i]) {
          drawTradeFlag(i);
        }
      }
    },
    {
      deep: true,
    }
  );

  // 监听图表点击空白 清空选中状态
  const actionCount = ref(0);
  eventBus.on("chartMouseUp", () => {
    const oldActionCount = actionCount.value;
    setTimeout(() => {
      if (oldActionCount === actionCount.value && cantEditLineId.value) {
        changeEditType(null, null, false);
        cantEditLineId.value = null;
      }
    });
  });

  // 设置线颜色
  const setColor = (
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

    if ("setReverseButtonBackgroundColor" in line) {
      line
        .setReverseButtonBackgroundColor(color)
        .setReverseButtonBorderColor(transparent)
        .setCloseButtonBorderColor(transparent)
        .setCloseButtonBackgroundColor(color)
        .setCloseButtonIconColor("#f53058");
    }
    if ("setCancelButtonBackgroundColor" in line) {
      line
        .setCancelButtonBackgroundColor(color)
        .setCancelButtonBorderColor(transparent)
        .setCancelButtonIconColor("#f53058");
    }
  };

  // 获取最新的order信息
  const getLatestOrder = (
    chartId: string,
    lineType: LineType,
    orderId: number
  ): resOrders | resPendingOrders | null => {
    const stateKey = `${lineType}Lines` as keyof ILineState;
    const lines = lineState[stateKey][chartId];
    if (!lines) return null;

    const lineItem = lines.find((item) => item.orderInfo.id === orderId);
    return lineItem ? lineItem.orderInfo : null;
  };

  // 进入编辑状态
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
    // 加入线属性
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
    // 拿满足条件的线信息
    for (const i in lineState) {
      if (i === "historyLines") continue; // 历史线不处理
      const key = i as "marketLines" | "pendingLines" | "slLines" | "tpLines";
      const stateKey = key.replace("Lines", "") as LineType;
      if (chartId) {
        const list = lineState[key][chartId];
        if (list) {
          const targetList = formatList(list, stateKey);
          allList.push(...targetList);
        }
      }
      // 无图表id代表则操作所有图表
      else {
        Object.values(lineState[key]).forEach((list) => {
          const targetList = formatList(list, stateKey);
          allList.push(...targetList);
        });
      }
    }
    // 满足的线给颜色
    allList.forEach((item) => {
      if (orderId) {
        setColor(
          item.orderInfo.type,
          item.line,
          orderId === item.orderInfo.id ? ifEdit : false
        );
      }
      // 无线id代表则设置所有线
      else {
        setColor(item.orderInfo.type, item.line, ifEdit);
      }
    });
  };
  // 线加载时的样式
  const setLoadingStyle = (line: LineAdapter) => {
    const loadingColor = "rgba(128,128,128,0.5)";
    line
      .setLineColor(loadingColor)
      .setBodyBackgroundColor(loadingColor)
      .setQuantityBackgroundColor(loadingColor)
      .setQuantityBorderColor(loadingColor)
      .setBodyBorderColor(loadingColor);
    if ("setCloseButtonBackgroundColor" in line) {
      line.setCloseButtonBackgroundColor(loadingColor);
    }
    if ("setReverseButtonBackgroundColor" in line) {
      line.setReverseButtonBackgroundColor(loadingColor);
    }
    if ("setCancelButtonBackgroundColor" in line) {
      line.setCancelButtonBackgroundColor(loadingColor);
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

    const targetOrders = orders.filter(config.shouldDraw);

    // 清理无效线条
    for (let i = 0; i < chartLines.length; i++) {
      const lineItem = chartLines[i];
      if (!lineItem) continue;
      const ifExist =
        targetOrders.findIndex((e) => e.id === lineItem.orderInfo.id) > -1;
      // 订单线不在订单列表中
      if (!ifExist) {
        // line.remove()之后line不可用
        try {
          lineItem.line.remove();
        } catch (error) {}
        chartLines.splice(i, 1);
      }
    }

    targetOrders.forEach((order) => {
      const orderId = order.id;

      const index = chartLines.findIndex((e) => e.orderInfo.id === orderId);
      // 创建新线条
      if (index === -1) {
        const line = config.createLine(chart.widget!);
        line
          .setBodyTextColor("#fff")
          .setPrice(config.getPrice(order))
          .setText(config.getText(order))
          .setLineLength(2);
        // 线的其他点操作
        config.setupLine(line, order);
        // 设置买卖订单对应颜色
        setColor(order.type, line, order.id === cantEditLineId.value);
        // 添加到对应的线集合
        chartLines.push({ line, orderInfo: { ...order } });
      }

      if (index > -1) {
        const target = chartLines[index];
        if (config.shouldUpdate(target.orderInfo, order)) {
          target.line.setText(config.getText(order));
          if (config.updateLine) {
            config.updateLine(target.line, order);
          }
        }
        target.orderInfo = { ...order };
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
          const positionType =
            order.type === 1
              ? i18n.global.t("order.buy")
              : i18n.global.t("order.sell");
          return `${order.id} ${positionType} ${i18n.global.t(
            "order.profit"
          )}： ${order.profit} SL: ${order.sl_price} TP: ${order.tp_price}`;
        },
        shouldDraw: () => true,
        createLine: (widget) => widget.chart().createPositionLine(),
        setupLine: (line, order) => {
          const direction = getTradingDirection(order.type);
          const revBtnIconColor =
            direction === "buy" ? colors.value.downColor : colors.value.upColor;
          const marketLine = line as Library.IPositionLineAdapter;

          marketLine
            .setReverseButtonIconColor(revBtnIconColor) // 反向持仓按钮颜色
            .setQuantity((order.volume / 100).toString()) // 保护持仓内容
            // 点击反向持仓回调
            .onReverse(() => {
              handleMarketAction("reverse", chartId, order.id, marketLine);
            })
            //关闭按钮回调
            .onClose(() => {
              handleMarketAction("close", chartId, order.id, marketLine);
            })
            // 保护持仓回调
            .onModify(() => {
              handleMarketAction("modify", chartId, order.id, marketLine);
            });
        },
        // 市价单盈利变化更新主体提示信息
        shouldUpdate: (oldOrder, newOrder) => {
          return oldOrder.profit !== newOrder.profit;
        },
      }
    );
  };

  // 挂单绘制
  const drawPendingOrderLine = (chartId: string) => {
    const chart = chartList.value.find((e) => e.id === chartId);
    if (!chart) return;

    drawGenericLines(
      chartId,
      pendingOrder.value.filter((order) => order.symbol === chart.symbol),
      lineState.pendingLines,
      {
        lineType: "pending",
        getPrice: (order) => getPendingPrice(order),
        getText: (order) => {
          // 订单id+类型
          const type = orderTypeOptions.find((e) => e.type === order.type);
          return `${order.id} ${type?.label}`;
        },
        shouldDraw: () => true,
        createLine: (widget) => widget.chart().createOrderLine(),
        setupLine: (line, order) => {
          const pendingLine = line as Library.IOrderLineAdapter;
          pendingLine
            .setQuantity((order.volume / 100).toString())
            // 编辑
            .onModify(() => {
              handlePendingAction("modify", chartId, order.id, pendingLine);
            })
            // 关闭
            .onCancel(() => {
              handlePendingAction("cancel", chartId, order.id, pendingLine);
            })
            // 移动结束
            .onMove(() => {
              handlePendingAction("move", chartId, order.id, pendingLine);
            });
        },
        shouldUpdate: (oldOrder, newOrder) => {
          const oldPrice = getPendingPrice(oldOrder);
          const newPrice = getPendingPrice(newOrder);
          return oldPrice !== newPrice;
        },
      }
    );
  };

  // 绘制止损止盈线
  type TDrwaLineType = "tp" | "sl";
  const drawPriceLine = (
    lineType: TDrwaLineType,
    chartId: string,
    orderType: "market" | "pending" = "market"
  ) => {
    const chart = chartList.value.find((e) => e.id === chartId);
    if (!chart) return;

    const field = lineType === "tp" ? "tp_price" : "sl_price";

    const stateLines =
      lineType === "tp" ? lineState.tpLines : lineState.slLines;

    const targetList =
      orderType === "market" ? marketOrder.value : pendingOrder.value;

    drawGenericLines(
      chartId, // 图表id
      targetList.filter((order) => order.symbol === chart.symbol), // 处理的目标订单
      stateLines, // 线类别集合
      {
        lineType, // 线
        getPrice: (order) => +order[field]!, // 止盈止损字段确定价格线
        getText: (order) => `${lineType.toUpperCase()}: ${order[field]}`,
        shouldDraw: (order) => !!order[field], // 止盈止损有值才绘制
        createLine: (widget) => widget.chart().createOrderLine(),
        setupLine: (line, order) => {
          const orderLine = line as Library.IOrderLineAdapter;
          orderLine
            .setQuantity((order.volume / 100).toString()) // 编辑按钮内容
            // 编辑按钮点击回调
            .onModify(() => {
              if (orderType === "market") {
                handleMarketAction("modify", chartId, order.id, orderLine);
              }
              if (orderType === "pending") {
                handlePendingAction("modify", chartId, order.id, orderLine);
              }
            })
            // 关闭回调
            .onCancel(() => {
              const action = `${lineType}Cancel` as "slCancel" | "tpCancel";
              if (orderType === "market") {
                handleMarketAction(action, chartId, order.id, line);
              }
              if (orderType === "pending") {
                handlePendingAction(action, chartId, order.id, orderLine);
              }
            })
            // 移动结束回调
            .onMove(() => {
              const action = `${lineType}Modify` as "slModify" | "tpModify";
              if (orderType === "market") {
                handleMarketAction(action, chartId, order.id, orderLine);
              }
              if (orderType === "pending") {
                handlePendingAction(action, chartId, order.id, orderLine);
              }
            });
        },
        // 止盈止损变化更新
        shouldUpdate: (oldOrder, newOrder) => {
          return (
            oldOrder.tp_price !== newOrder.tp_price ||
            oldOrder.sl_price !== newOrder.sl_price
          );
        },
        // 更新线位置
        updateLine: (line, order) => {
          line.setPrice(lineType === "tp" ? order.tp_price : order.sl_price);
        },
      }
    );
  };

  const createNote = (chart: any, item: any, drawType: "open" | "close") => {
    const { open_price, type, profit, open_time, close_time, close_price, id } =
      item;
    const volume = item.volume / 1000;
    const colorList = [colors.value.upColor, colors.value.downColor];
    const time = drawType === "open" ? open_time : close_time;
    const price = drawType === "open" ? open_price : close_price;
    const noteId = chart
      .widget!.activeChart()
      .createMultipointShape([{ time: time / 1000, price }], {
        shape: "note", // 锚定注释
        lock: true, // 禁止移动
        disableSelection: false, // 禁止选中
        disableSave: true, // 禁止保存
        disableUndo: true, // 禁止撤销
        zOrder: "top", // 置顶
      });
    const note = chart
      .widget!.activeChart()
      .getShapeById(noteId as Library.EntityId);

    const realType = drawType === "open" ? type : 1 - type; // 开仓时的类型和收盘时的类型相反

    const dire = getTradingDirection(realType);

    // 交易方向+手数+建仓价格；
    const openText = `${id}: ${dire} ${volume} at ${open_price} profit: ${profit}`;

    // 交易方向 + 手数 + 平仓价格 + 盈亏;
    const closeText = `${id}: ${dire} ${volume} at ${close_price} profit: ${profit}`;
    note.setProperties({
      fixedSize: false,
      markerColor: colorList[realType],
      backgroundColor: "rgba(23, 24, 26, 0.5)",
      borderColor: "rgba(255, 255, 255, 0.5)",
      text: drawType === "open" ? openText : closeText,
    });
  };

  // 绘制交易标记
  const drawTradeFlag = (chartId: string) => {
    const chart = chartList.value.find((e) => e.id === chartId);
    if (!chart || !chart.widget) return;

    const colorList = [colors.value.upColor, colors.value.downColor];

    marketOrderHistory.value.forEach((item) => {
      const { close_price, open_price, type, close_time, open_time } = item;

      const lineId = chart.widget!.activeChart().createMultipointShape(
        [
          { time: open_time / 1000, price: open_price },
          { time: close_time / 1000, price: close_price },
        ],
        {
          shape: "trend_line", // 趋势线
          lock: true, // 禁止移动
          disableSelection: true, // 禁止选中
          disableSave: true, // 禁止保存
          disableUndo: true, // 禁止撤销
          zOrder: "top", // 置顶
        }
      );

      const line = chart
        .widget!.activeChart()
        .getShapeById(lineId as Library.EntityId);
      line.setProperties({ linecolor: colorList[type], linestyle: 1 });
      createNote(chart, item, "open");
      createNote(chart, item, "close");
    });
  };

  // 获取挂单价格
  const getPendingPrice = (
    order: resOrders & { order_price_time?: number }
  ) => {
    if ([6, 7].includes(order.type)) {
      return order.order_price_time ? order.trigger_price : order.order_price;
    }
    return order.order_price;
  };

  // 市价单反向持仓 /  市价单关闭 / 市价单修改 / 市价单止盈止损编辑及取消
  const handleMarketAction = async (
    type:
      | "reverse"
      | "close"
      | "modify"
      | "slCancel"
      | "tpCancel"
      | "slModify"
      | "tpModify",
    chartId: string,
    orderId: number,
    line: LineAdapter
  ) => {
    actionCount.value++; // 正在操作线标志
    // 设置编辑状态
    if (
      checkAndSetEditState(chartId, orderId) &&
      !["slModify", "tpModify"].includes(type)
    ) {
      return;
    }
    const currentOrder = getLatestOrder(chartId, "market", orderId); // 获取订单最新信息
    if (!currentOrder) return;

    const actionId = `${orderId}@Market_${type}`;

    // 防止重复操作
    if (actionMap.value.get(actionId)) return;
    actionMap.value.set(actionId, true);

    // 修改操作
    if (type === "modify") {
      orderStore.state.editOrderInfo = { ...currentOrder };
      dialogStore.openDialog("marketOrderEditVisible");
      actionMap.value.delete(actionId);
      return;
    }

    // 是否止盈止损操作
    const ifSLTP = ["slCancel", "tpCancel", "slModify", "tpModify"].includes(
      type
    );
    const slTpField = type.includes("sl") ? "sl" : "tp";
    const slTpValue = type.includes("Cancel") ? 0 : line.getPrice();

    try {
      const ifOne = orderStore.state.ifOne;
      // 开启了快捷交易
      if (ifOne) {
        // 操作前视觉反馈
        setLoadingStyle(line);
        switch (type) {
          // 反向持仓
          case "reverse":
            orderStore.state.editOrderInfo = { ...currentOrder };
            orderStore.addMarket("reverse");
            break;
          // 关闭持仓
          case "close":
            orderStore.delMarketOrder({
              ...currentOrder,
              volume: currentOrder.volume / 100,
            });
            break;
          // 止盈止损取消
          case "slCancel":
          case "tpCancel":
          case "slModify":
          case "tpModify": {
            const { symbol, id } = currentOrder;
            const updata: reqEditOpeningOrders = {
              symbol,
              id,
            };
            updata[slTpField] = slTpValue;
            await orderStore.modifyMarketOrder(updata, currentOrder);
            // 如果止盈止损值为0则删除线
            if (updata[slTpField] === 0) {
              line.remove();
            }
            break;
          }
        }
      }
      // 还没有提示过快捷交易
      else if (ifOne === null) {
        dialogStore.openDialog("disclaimersVisible");
      }
      // 不允许快捷交易
      // 止盈止损操作
      else if (ifSLTP) {
        const field = type.includes("sl") ? "sl" : "tp";
        orderStore.state.editOrderInfo = {
          ...currentOrder,
          [`${field}_price`]: slTpValue,
        };
        dialogStore.openDialog("marketOrderEditVisible");
      } else {
        orderStore.state.marketConfirmInfo.type = type as
          | "reverse"
          | "double"
          | "close";
        orderStore.state.marketConfirmInfo.volume = currentOrder.volume / 100;
        orderStore.state.editOrderInfo = { ...currentOrder };
        dialogStore.openDialog("marketOrderComfirmVisible");
      }

      // 操作成功后删除行为标志
      actionMap.value.delete(actionId);
      // 恢复颜色
      if (["slModify", "tpModify"].includes(type)) {
        setColor(currentOrder.type, line, true);
      }
    } catch (error) {
      // 止盈止损失败线归位
      if (ifSLTP) {
        line.setPrice(currentOrder[`${slTpField}_price`]);
      }
      setColor(currentOrder.type, line, true);
    }
  };

  type THandlePendingAction =
    | "modify"
    | "cancel"
    | "move"
    | "slCancel"
    | "tpCancel"
    | "slModify"
    | "tpModify";
  // 挂单编辑删除
  const handlePendingAction = async (
    handleType: THandlePendingAction,
    chartId: string,
    orderId: number,
    line: LineAdapter
  ) => {
    actionCount.value++;
    if (
      checkAndSetEditState(chartId, orderId) &&
      !["move", "slModify", "tpModify"].includes(handleType)
    ) {
      return;
    }
    const currentOrder = getLatestOrder(
      chartId,
      "pending",
      orderId
    ) as resPendingOrders;
    if (!currentOrder) return;

    const actionId = `${orderId}@Pending_${handleType}`;

    // 防止重复操作
    if (actionMap.value.get(actionId)) return;
    actionMap.value.set(actionId, true);

    try {
      const {
        type,
        id,
        symbol,
        volume,
        time_expiration,
        trigger_price,
        order_price,
        sl_price,
        tp_price,
      } = currentOrder;
      const now_price = line.getPrice();
      setLoadingStyle(line);
      switch (handleType) {
        case "modify":
          orderStore.state.editOrderInfo = { ...currentOrder };
          dialogStore.openDialog("PendingOrderEditVisible");
          break;
        case "cancel":
          await orderStore.delPendingOrder(currentOrder);
          line.remove();
          break;
        case "move":
        case "slCancel":
        case "tpCancel":
        case "slModify":
        case "tpModify":
          const updata: reqPendingOrdersAdd = {
            type,
            symbol,
            volume: volume / 100,
            time_expiration,
            order_price,
            trigger_price,
            sl: sl_price,
            tp: tp_price,
          };
          if (handleType === "move") {
            updata.order_price = now_price;
          }
          if (handleType === "slCancel") {
            updata.sl = 0;
          }
          if (handleType === "tpCancel") {
            updata.tp = 0;
          }
          if (handleType === "slModify") {
            updata.sl = now_price;
          }
          if (handleType === "tpModify") {
            updata.tp = now_price;
          }
          await orderStore.modifyPendingOrder({ ...updata, id }, currentOrder);
          if (handleType === "slCancel" || handleType === "tpCancel") {
            line.remove();
          }
          break;
      }
      if (!handleType.toLowerCase().includes("cancel")) {
        setColor(currentOrder.type, line, true);
      }
    } catch {
      const originPrice = getPendingPrice(currentOrder);
      line.setPrice(originPrice);
      setColor(currentOrder.type, line, true);
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
