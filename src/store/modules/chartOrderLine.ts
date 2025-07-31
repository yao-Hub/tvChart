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
  resHistoryOrders,
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
  lineId: Library.EntityId | null;
  orderInfo: resOrders;
  widget?: Library.IChartingLibraryWidget;
  noteType?: "open" | "close";
}

interface ILineState {
  marketLines: Record<string, IMarketLineItem[]>;
  pendingLines: Record<string, IOrderItem[]>;
  marketSlLines: Record<string, IOrderItem[]>;
  marketTpLines: Record<string, IOrderItem[]>;
  pendingSlLines: Record<string, IOrderItem[]>;
  pendingTpLines: Record<string, IOrderItem[]>;
  historyLines: Record<string, IHistoryItem[]>;
}

type LineType = "market" | "tp" | "sl" | "pending";
type LineAdapter = Library.IPositionLineAdapter | Library.IOrderLineAdapter;

type THandlePendingAction =
  | "modify"
  | "cancel"
  | "move"
  | "slCancel"
  | "tpCancel"
  | "slMove"
  | "tpMove";

// 通用配置接口
interface LineDrawConfig {
  getPrice: (order: resOrders & { order_price_time?: number }) => number; // 线价格位
  createLine: (chart: Library.IChartingLibraryWidget) => LineAdapter; // 创建何种线
  getText: (order: resOrders) => string; // 主体显示文字
  shouldDraw: (order: resOrders) => boolean; // 绘制条件
  setupLine: (line: LineAdapter, order: resOrders) => void; // 额外的线操作
  shouldUpdate: (oldOrder: resOrders, newOrder: resOrders) => boolean; // 何时更新线信息
  updateLine?: (line: LineAdapter, order: resOrders) => void; // 更新线什么信息
  colorType?: "sell" | "buy";
}

export const useChartOrderLine = defineStore("chartOrderLine", () => {
  const chartInitStore = useChartInit();
  const orderStore = useOrder();
  const themeStore = useTheme();
  const dialogStore = useDialog();

  // 所有画线集合
  const lineState = reactive<ILineState>({
    marketLines: {},
    pendingLines: {},
    marketSlLines: {},
    marketTpLines: {},
    pendingSlLines: {},
    pendingTpLines: {},
    historyLines: {},
  });

  const storageRecord = sessionStorage.getItem("recordShowState");
  const recordShowState = reactive<Record<string, boolean>>({
    positions: true,
    pending: true,
    histories: false,
    sltp: true,
  });
  if (storageRecord) {
    const records = JSON.parse(storageRecord);
    Object.keys(recordShowState).forEach((key) => {
      recordShowState[key] = records[key];
    });
  }

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

  // 图表交易历史数据
  const chartOrderHistory = ref<resHistoryOrders[]>([]);

  // 颜色映射
  const colors = computed(() => {
    const downColor = themeStore.getUpDownColor("downHoverColor");
    const upColor = themeStore.getUpDownColor("upHoverColor");
    const upHoverColor = hexToRGBA(upColor, 0.3);
    const downHoverColor = hexToRGBA(downColor, 0.3);
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

  // 涨跌颜色调整对应的线颜色
  watch(
    () => themeStore.upDownTheme,
    () => {
      changeHistoryColor();
      changeOrderEditType(null, null, false);
    }
  );

  // 监听图表加载状态 （图表重新加载清除线集合）
  watch(
    () => chartsLoaded.value,
    (val) => {
      for (const i in val) {
        if (!val[i]) {
          clearLines(i);
        }
      }
    },
    { deep: true }
  );

  // 监听持仓单变化和图表加载状态
  watch(
    () => [marketOrder.value, chartsLoaded.value, recordShowState],
    () => {
      for (const i in chartsLoaded.value) {
        if (chartsLoaded.value[i]) {
          if (recordShowState.positions) {
            drawMarketOrderLine(i);
          } else {
            clearLines(i, ["marketLines"]);
          }
          if (recordShowState.sltp) {
            drawPriceLine("tp", i, "market");
            drawPriceLine("sl", i, "market");
          } else {
            clearLines(i, ["marketSlLines", "marketTpLines"]);
          }
        }
      }
    },
    { deep: true }
  );

  // 监听挂单变化和图表加载状态
  watch(
    () => [pendingOrder, chartsLoaded.value, recordShowState],
    () => {
      for (const i in chartsLoaded.value) {
        if (chartsLoaded.value[i]) {
          if (recordShowState.pending) {
            drawPendingOrderLine(i);
          } else {
            clearLines(i, ["pendingLines"]);
          }
          if (recordShowState.sltp) {
            drawPriceLine("tp", i, "pending");
            drawPriceLine("sl", i, "pending");
          } else {
            clearLines(i, ["pendingSlLines", "pendingTpLines"]);
          }
        }
      }
    },
    {
      deep: true,
    }
  );

  // 监听交易历史和图表加载状态
  watch(
    () => [chartOrderHistory, chartsLoaded.value, recordShowState],
    () => {
      for (const i in chartsLoaded.value) {
        if (chartsLoaded.value[i]) {
          if (recordShowState.histories) {
            drawTradeFlag(i);
          } else {
            clearLines(i, ["historyLines"]);
          }
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
        changeOrderEditType(null, null, false);
        cantEditLineId.value = null;
      }
    });
  });

  // 控制显示记录
  const changeRecordShow = (field: string) => {
    recordShowState[field] = !recordShowState[field];
    sessionStorage.setItem("recordShowState", JSON.stringify(recordShowState));
  };

  // 更改历史订单的线条和锚点颜色
  const changeHistoryColor = () => {
    const list = Object.values(lineState.historyLines).flat();
    list.forEach((item) => {
      const colorList = [colors.value.upColor, colors.value.downColor];
      const { type } = item.orderInfo;
      const node = item
        .widget!.activeChart()
        .getShapeById(item.lineId as Library.EntityId);
      if (item.noteType) {
        const realType = item.noteType === "open" ? type : 1 - type; // 开仓时的类型和收盘时的类型相反
        node.setProperties({
          markerColor: colorList[realType],
        });
      } else {
        node.setProperties({ linecolor: colorList[type] });
      }
    });
  };

  // 设置线颜色
  const setColor = (
    orderType: number | "sell" | "buy",
    line: LineAdapter,
    ifEdit: boolean = false
  ) => {
    const colorMap = {
      sell: ifEdit ? colors.value.downColor : colors.value.downHoverColor,
      buy: ifEdit ? colors.value.upColor : colors.value.upHoverColor,
    };
    let direction =
      typeof orderType === "number"
        ? getTradingDirection(orderType)
        : orderType;
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
      changeOrderEditType(chartId, orderId, true);
      cantEditLineId.value = orderId;
      return true;
    }
    return false;
  };

  // 更改编辑状态
  const changeOrderEditType = (
    chartId: string | null,
    orderId: number | null,
    ifEdit: boolean
  ) => {
    const allList: Array<{
      line: LineAdapter;
      orderInfo: resOrders;
      stateKey: LineType;
    }> = [];
    // 拿满足条件的线信息
    for (const i in lineState) {
      // 历史线不操作
      if (i === "historyLines") {
        continue;
      }
      const key = i as keyof ILineState;
      const stateKey = key.replace("Lines", "") as LineType;
      const list = chartId
        ? lineState[key][chartId]
        : Object.values(lineState[key]).flat();
      const stateKeyList = (list || []).map((item) => {
        return {
          ...item,
          stateKey,
        };
      });
      allList.push(...stateKeyList);
    }
    // 满足的线给颜色
    allList.forEach((item) => {
      let colorType: number | "sell" | "buy" = item.orderInfo.type;
      if (item.stateKey.toLowerCase().includes("tp")) {
        colorType = "buy";
      }
      if (item.stateKey.toLowerCase().includes("sl")) {
        colorType = "sell";
      }
      if (orderId) {
        setColor(
          colorType,
          item.line,
          orderId === item.orderInfo.id ? ifEdit : false
        );
      }
      // 无线id代表则设置所有线
      else {
        setColor(colorType, item.line, ifEdit);
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
        targetOrders.findIndex((e) => e.id === chartLines[i].orderInfo.id) > -1;
      // 订单线不在订单列表中
      if (!ifExist) {
        // line.remove()之后line不可用
        try {
          chartLines[i].line.remove();
        } catch (error) {
          console.log("error", error);
        }
        chartLines.splice(i, 1);
      }
    }

    for (let i = 0; i < targetOrders.length; i++) {
      const order = targetOrders[i];
      const orderId = order.id;

      const index = chartLines.findIndex((e) => e.orderInfo.id === orderId);

      // 创建新线条
      if (index === -1) {
        const line = config.createLine(chart.widget!);
        line
          .setBodyTextColor("#fff")
          .setPrice(config.getPrice(order))
          .setText(config.getText(order))
          .setLineLength(2)
          .setLineWidth(1);
        // 线的其他点操作
        config.setupLine(line, order);
        // 设置买卖订单对应颜色
        setColor(
          config.colorType || order.type,
          line,
          order.id === cantEditLineId.value
        );
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
    }
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
        getPrice: (order) => order.open_price,
        getText: (order) => {
          const { id, profit } = order;
          return `${id} ${i18n.global.t("order.profit")}: ${profit}`;
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
        updateLine: (line, order) => {
          line.setPrice(order.order_price);
        },
      }
    );
  };

  // 绘制止损止盈线
  const drawPriceLine = (
    lineType: "tp" | "sl",
    chartId: string,
    orderType: "market" | "pending"
  ) => {
    const chart = chartList.value.find((e) => e.id === chartId);
    if (!chart) return;

    const field = lineType === "tp" ? "tp_price" : "sl_price";

    const stateLines =
      lineType === "tp"
        ? lineState[`${orderType}TpLines`]
        : lineState[`${orderType}SlLines`];

    const targetList =
      orderType === "market" ? marketOrder.value : pendingOrder.value;

    drawGenericLines(
      chartId, // 图表id
      targetList.filter((order) => order.symbol === chart.symbol), // 处理的目标订单
      stateLines, // 线类别集合
      {
        colorType: lineType === "tp" ? "buy" : "sell",
        getPrice: (order) => +order[field]!, // 止盈止损字段确定价格线
        getText: (order) => {
          return `${order.id} ${lineType.toUpperCase()}: ${order[field]}`;
        },
        shouldDraw: (order) => +order[field] > 0, // 止盈止损有值才绘制
        createLine: (widget) => widget.chart().createOrderLine(),
        setupLine: (line, order) => {
          const orderLine = line as Library.IOrderLineAdapter;
          orderLine
            .setQuantity((order.volume / 100).toString()) // 编辑按钮内容
            .setLineStyle(2)
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
              const action = `${lineType}Move` as "slMove" | "tpMove";
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

  // 创建历史订单锚点
  const createNote = (
    chart: any,
    item: any,
    drawType: "open" | "close",
    chartId?: string
  ) => {
    const { open_price, type, profit, open_time, close_time, close_price, id } =
      item;
    const volume = item.volume / 100;
    const time = drawType === "open" ? open_time : close_time;
    const price = drawType === "open" ? open_price : close_price;
    // 更新锚点
    if (chartId) {
      const target = lineState.historyLines[chartId].find(
        (e) => e.noteType === drawType && e.orderInfo.id === item.id
      );
      const node = chart.widget
        .activeChart()
        .getShapeById(target?.lineId as Library.EntityId);
      node.setPoints([{ time: time / 1000, price }]);
      return;
    }

    // 创建锚点
    const colorList = [colors.value.upColor, colors.value.downColor];
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
    const openText = `open ${id}: ${dire} ${volume} at ${open_price} profit: ${profit}`;

    // 交易方向 + 手数 + 平仓价格 + 盈亏;
    const closeText = `close ${id}: ${dire} ${volume} at ${close_price} profit: ${profit}`;
    note.setProperties({
      fixedSize: false,
      markerColor: colorList[realType],
      backgroundColor: "rgba(23, 24, 26, 0.5)",
      borderColor: "rgba(255, 255, 255, 0.5)",
      text: drawType === "open" ? openText : closeText,
    });
    return noteId;
  };

  // 绘制交易标记
  const drawTradeFlag = (chartId: string) => {
    const chart = chartList.value.find((e) => e.id === chartId);
    if (!chart || !chart.widget) return;

    const colorList = [colors.value.upColor, colors.value.downColor];

    const list = chartOrderHistory.value.filter(
      (item) => item.symbol === chart.symbol
    );

    if (!lineState.historyLines[chartId]) {
      lineState.historyLines[chartId] = [];
    }

    for (let index = 0; index < list.length; index++) {
      const item = list[index];
      // 已经渲染过的订单
      const target = lineState.historyLines[chartId].find(
        (e) => e.orderInfo.id === item.id
      );
      if (target) {
        const entityId = target.lineId;
        const line = chart.widget
          .activeChart()
          .getShapeById(entityId as Library.EntityId);
        const info = target.orderInfo;
        line.setPoints([
          { time: info.open_time / 1000, price: info.open_price },
          { time: info.close_time / 1000, price: info.close_price },
        ]);
        createNote(chart, item, "open", chartId);
        createNote(chart, item, "close", chartId);
        continue;
      }
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

      lineState.historyLines[chartId].push({
        lineId,
        orderInfo: item,
        widget: chart.widget,
      });

      const line = chart
        .widget!.activeChart()
        .getShapeById(lineId as Library.EntityId);
      line.setProperties({ linecolor: colorList[type], linestyle: 1 });
      const openId = createNote(chart, item, "open");
      const closeId = createNote(chart, item, "close");
      const ids = [openId, closeId];
      const saveList = ids.map((id, index) => {
        return {
          lineId: id,
          orderInfo: item,
          widget: chart.widget,
          noteType: (index ? "close" : "open") as "close" | "open",
        };
      });
      lineState.historyLines[chartId].push(...saveList);
    }
  };

  // 不在k线范围的历史订单列表
  const noInRangeHistoryList = ref<resHistoryOrders[]>([]);
  // 设置交易历史列表
  const setHistoryOrder = (
    orders: resHistoryOrders[],
    klineMinTime: number
  ) => {
    const minTime = klineMinTime * 1000;
    for (let i = 0; i < noInRangeHistoryList.value.length; i++) {
      const order = noInRangeHistoryList.value[i];
      const target = chartOrderHistory.value.find((e) => e.id === order.id);
      // 当k线范围包含了历史订单的起始时间
      if (order.open_time > minTime) {
        target && (target.open_time = order.open_time);
        noInRangeHistoryList.value.splice(i, 1);
        i--;
      }
      // 将开始时间调整为最小时间
      else {
        target && (target.open_time = minTime);
      }
    }

    const idSet = new Set(chartOrderHistory.value.map((order) => order.id));
    const uniqueOrders = orders.filter((order) => !idSet.has(order.id));
    uniqueOrders.forEach((item) => {
      if (item.open_time < minTime) {
        noInRangeHistoryList.value.push({ ...item });
        item.open_time = minTime;
      }
    });
    chartOrderHistory.value.push(...uniqueOrders);
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
      | "slMove"
      | "tpMove",
    chartId: string,
    orderId: number,
    line: LineAdapter
  ) => {
    actionCount.value++; // 正在操作线标志
    // 设置编辑状态
    if (
      checkAndSetEditState(chartId, orderId) &&
      !["slMove", "tpMove"].includes(type)
    ) {
      return;
    }
    const currentOrder = getLatestOrder(chartId, "market", orderId); // 获取订单最新信息
    if (!currentOrder) return;

    const actionId = `${orderId}@Market_${type}`;

    // 防止重复操作
    if (actionMap.value.get(actionId)) return;
    actionMap.value.set(actionId, true);

    // 中间按钮修改操作
    if (type === "modify") {
      orderStore.state.editOrderInfo = { ...currentOrder };
      dialogStore.openDialog("marketOrderEditVisible");
      actionMap.value.delete(actionId);
      return;
    }

    // 是否止盈止损操作
    const ifSLTP = ["slCancel", "tpCancel", "slMove", "tpMove"].includes(type);
    const slTpField = type.toLowerCase().includes("sl") ? "sl" : "tp";
    const slTpValue = type.toLowerCase().includes("cancel")
      ? 0
      : line.getPrice();

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
          // 止盈止损取消和移动
          case "slCancel":
          case "tpCancel":
          case "slMove":
          case "tpMove": {
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
        const field = type.toLowerCase().includes("sl") ? "sl" : "tp";
        orderStore.state.editOrderInfo = {
          ...currentOrder,
          [`${field}_price`]: slTpValue,
        };

        // 止盈止损线归位
        const originPrice = currentOrder[`${field}_price`];
        line.setPrice(originPrice);

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
      if (["slMove", "tpMove"].includes(type)) {
        setColor(currentOrder.type, line, true);
      }
    } catch (error) {
      // 止盈止损失败线归位
      if (ifSLTP) {
        line.setPrice(currentOrder[`${slTpField}_price`]);
      }
      setColor(currentOrder.type, line, true);
      actionMap.value.delete(actionId);
    }
  };

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
      !["move", "slMove", "tpMove"].includes(handleType)
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
    try {
      const now_price = line.getPrice();

      // 挂单（止盈止损）线中间编辑按钮点击
      if (handleType === "modify") {
        orderStore.state.editOrderInfo = { ...currentOrder };
        dialogStore.openDialog("PendingOrderEditVisible");
        actionMap.value.delete(actionId);
        return;
      }

      const ifOne = orderStore.state.ifOne;
      if (ifOne) {
        setLoadingStyle(line);
        switch (handleType) {
          // 挂单线取消按钮点击
          case "cancel":
            await orderStore.delPendingOrder(currentOrder);
            line.remove();
            break;
          // 挂单线移动结束
          case "move":
          // 挂单止盈止损线取消按钮点击
          case "slCancel":
          case "tpCancel":
          // 挂单止盈止损移动
          case "slMove":
          case "tpMove":
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
            if (handleType === "slMove") {
              updata.sl = now_price;
            }
            if (handleType === "tpMove") {
              updata.tp = now_price;
            }
            await orderStore.modifyPendingOrder(
              { ...updata, id },
              currentOrder
            );
            if (handleType === "slCancel" || handleType === "tpCancel") {
              line.remove();
            }
            break;
        }
        if (!handleType.toLowerCase().includes("cancel")) {
          setColor(currentOrder.type, line, true);
        }
      }
      // 还没有提示过快捷交易
      else if (ifOne === null) {
        dialogStore.openDialog("disclaimersVisible");
      } else {
        const editData = { ...currentOrder };
        switch (handleType) {
          case "move":
            editData.order_price = now_price;
            line.setPrice(order_price);
            break;
          case "slCancel":
            editData.sl_price = 0;
            break;
          case "tpCancel":
            editData.tp_price = 0;
            break;
          case "slMove":
            editData.sl_price = now_price;
            line.setPrice(sl_price);
            break;
          case "tpMove":
            editData.tp_price = now_price;
            line.setPrice(tp_price);
            break;
        }
        orderStore.state.editOrderInfo = { ...editData };
        dialogStore.openDialog("PendingOrderEditVisible");
      }
    } catch {
      let colorType: number | "sell" | "buy" = type;
      let originPrice = getPendingPrice(currentOrder);
      if (handleType.toLowerCase().includes("sl")) {
        originPrice = sl_price;
        colorType = "sell";
      }
      if (handleType.toLowerCase().includes("tp")) {
        originPrice = tp_price;
        colorType = "buy";
      }
      line.setPrice(originPrice);
      setColor(colorType, line, true);
    } finally {
      actionMap.value.delete(actionId);
    }
  };

  // 聚焦到某个订单线
  const focusLine = (orderId: number) => {
    changeOrderEditType(null, orderId, true);
    cantEditLineId.value = orderId;
  };

  // 清除所有线和标记
  const clearLines = (
    chartId: string | null,
    lineTypes: Array<keyof ILineState> = [
      "marketLines",
      "pendingLines",
      "marketSlLines",
      "marketTpLines",
      "pendingSlLines",
      "pendingTpLines",
      "historyLines",
    ]
  ) => {
    lineTypes.forEach((type) => {
      const list = Object.entries(lineState[type]);
      for (let index = 0; index < list.length; index++) {
        const [cid, lines] = list[index];
        if (chartId && chartId !== cid) {
          continue;
        }
        lines.forEach((item: IMarketLineItem | IOrderItem | IHistoryItem) => {
          try {
            if ("widget" in item && item.lineId) {
              item.widget?.activeChart().removeEntity(item.lineId);
            }
            if ("line" in item) {
              item.line.remove();
            }
          } catch {}
        });
        lineState[type][cid] = [];
      }
    });
  };

  const $reset = () => {
    clearLines(null);

    chartOrderHistory.value = [];
  };

  return {
    lineState,
    $reset,
    setHistoryOrder,
    focusLine,
    recordShowState,
    changeRecordShow,
    clearLines,
  };
});
