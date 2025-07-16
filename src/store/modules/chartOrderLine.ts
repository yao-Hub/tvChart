import { computed, reactive, watch } from "vue";
import { defineStore } from "pinia";
import { throttle } from "lodash";

import * as Library from "public/charting_library";
import { resOrders } from "api/order/index";

import { useChartInit } from "./chartInit";
import { useOrder } from "./order";
import { useTheme } from "./theme";
import { useDialog } from "./dialog";

interface IMarketLineItem {
  line: Library.IPositionLineAdapter;
  orderInfo: resOrders;
}

type TOrderLine = Record<string | number, Library.IOrderLineAdapter>;

interface IState {
  marketLines: Record<string, IMarketLineItem[]>;
  pendingLines: Record<string, TOrderLine>;
  slLines: Record<string, TOrderLine>;
  tpLines: Record<string, TOrderLine>;
  actionMap: Map<string, boolean>;
}

export const useChartOrderLine = defineStore("chartOrderLine", () => {
  const chartInitStore = useChartInit();
  const orderStore = useOrder();
  const themeStore = useTheme();
  const dialogStore = useDialog();

  const chartList = computed(() => chartInitStore.state.chartWidgetList || []);
  const marketOrder = computed(
    () => orderStore.state.orderData.marketOrder || []
  );
  const pendingOrder = computed(
    () => orderStore.state.orderData.pendingOrder || []
  );
  const marketOrderHistory = computed(
    () => orderStore.state.orderData.marketOrderHistory || []
  );

  const downColor = computed(() => themeStore.getUpDownColor("downColor"));
  const upColor = computed(() => themeStore.getUpDownColor("upColor"));

  watch(
    () => [marketOrder, chartList.value.length],
    () => {
      if (!chartList.value.length) {
        return;
      }
      drawMarketOrderLine();
      drawTpLine();
      drawSlLine();
    },
    {
      deep: true,
    }
  );

  watch(
    () => [pendingOrder, chartList],
    () => {
      if (!chartList.value.length) {
        return;
      }
      drawPendingOrderLine();
    },
    {
      deep: true,
    }
  );

  watch(
    () => [marketOrderHistory, chartList],
    () => {
      if (!chartList.value.length) {
        return;
      }
      draoTradeFlag();
      drawTradeHistory();
    },
    {
      deep: true,
    }
  );

  const state = reactive<IState>({
    marketLines: {},
    pendingLines: {},
    slLines: {},
    tpLines: {},
    actionMap: new Map(),
  });

  const setLineColor = (
    lineType: "market" | "pending" | "sl" | "tp",
    type: "sell" | "buy",
    line: Library.IOrderLineAdapter | Library.IPositionLineAdapter
  ) => {
    const colorMap = {
      market: {
        sell: downColor.value,
        buy: upColor.value,
      },
      pending: {
        sell: "",
        buy: "",
      },
      sl: {
        sell: "",
        buy: "",
      },
      tp: {
        sell: "",
        buy: "",
      },
    };
    const color = colorMap[lineType][type];
    line
      // 水平线
      .setLineColor(color)
      // 主体
      .setBodyBorderColor(color)
      // 保护持仓
      .setQuantityBorderColor(color)
      .setQuantityBackgroundColor(color);

    if (lineType === "market") {
      // 平仓反手
      (line as Library.IPositionLineAdapter)
        .setReverseButtonBorderColor(color)
        // 关闭持仓
        .setCloseButtonBorderColor(color);
    }
  };

  // 绘制市价单线
  const drawMarketOrderLine = throttle(() => {
    chartList.value.forEach((chart) => {
      const chartId = chart.id;
      const chartSymbol = chart.symbol;

      // 初始化空间
      if (!state.marketLines[chartId]) {
        state.marketLines[chartId] = [];
      }

      const chartLines = state.marketLines[chartId];
      const activeOrderIds = new Set<string>();
      const existingLinesMap = new Map<string, IMarketLineItem>();

      // 创建现有订单线映射
      chartLines.forEach((lineItem) => {
        existingLinesMap.set(lineItem.orderInfo.id.toString(), lineItem);
      });

      // 过滤当前图表品种的订单
      marketOrder.value
        .filter((order) => order.symbol === chartSymbol)
        .forEach((order) => {
          const orderId = order.id.toString();
          activeOrderIds.add(orderId);

          const orderType = order.type === 1 ? "sell" : "buy";

          // 获取订单类型显示文本
          const positionType = order.type === 1 ? "多头持仓" : "空头持仓";
          const text = `${orderId} ${positionType} 盈亏：${order.profit}`;

          // 新增订单线
          if (!existingLinesMap.has(orderId)) {
            if (chart.widget) {
              const line = chart.widget.chart().createPositionLine();
              line.setPrice(order.open_price).setText(text);

              line
                .setLineLength(2) // 距离右边长度
                .setLineStyle(2) // Solid = 0; Dotted = 1 Dashed = 2
                .setQuantity((order.volume / 100).toString())
                .onReverse(order, () => {
                  console.log("onReverse", order);
                })
                .onClose(order, () => handleMarketClose(chartId, order, line))
                .onModify(order, () => {
                  orderStore.state.editOrderInfo = order;
                  dialogStore.openDialog("MarketOrderEditVisible");
                });

              // 根据订单类型设置颜色
              setLineColor("market", orderType, line);

              chartLines.push({ line, orderInfo: { ...order } });
            }
          }
          // 更新已有订单线
          else {
            const target = chartLines.find(
              (item) => item.orderInfo.id === order.id
            );
            if (target) {
              // 只要利润变化就更新文本
              if (+target.orderInfo.profit !== +order.profit) {
                target.line.setText(text);
              }
              // 总是更新存储的订单信息
              target.orderInfo = { ...order };
            }
          }
        });

      // 清理已关闭的订单线
      for (let i = chartLines.length - 1; i >= 0; i--) {
        const lineItem = chartLines[i];
        const orderId = lineItem.orderInfo.id.toString();

        if (!activeOrderIds.has(orderId)) {
          lineItem.line.remove();
          chartLines.splice(i, 1);
        }
      }
    });
  }, 300);

  // 绘制挂单线
  const drawPendingOrderLine = () => {};

  // 绘制止盈线
  const drawTpLine = () => {};

  // 绘制止损线
  const drawSlLine = () => {};

  // 绘制交易标记
  const draoTradeFlag = () => {};

  // 绘制交易历史
  const drawTradeHistory = () => {};

  // 点击订单线改变相关样式
  const clickLine = () => {};

  // 市价单关闭
  const handleMarketClose = (
    chartId: string,
    order: resOrders,
    line: Library.IPositionLineAdapter
  ) => {
    const actionId = `${order.id}@MarketClose`;
    const actioning = state.actionMap.get(actionId);
    if (actioning) {
      return;
    }
    state.actionMap.set(actionId, true);
    if (orderStore.state.ifOne) {
      line.setLineColor("rgba(128,128,128,0.5)");
      const orderType = order.type === 1 ? "sell" : "buy";
      orderStore
        .delMarketOrder({
          ...order,
          volume: order.volume / 100,
        })
        .then(() => {
          const chartLines = state.marketLines[chartId];
          // 立即删除订单线
          const index = chartLines.findIndex(
            (item) => item.orderInfo.id === order.id
          );
          if (index !== -1) {
            const lineItem = chartLines[index];
            lineItem.line.remove();
            chartLines.splice(index, 1);
          }
        })
        .catch(() => setLineColor("market", orderType, line))
        .finally(() => state.actionMap.delete(actionId));
      return;
    }
    if (orderStore.state.ifOne === null) {
      dialogStore.openDialog("disclaimersVisible");
      return;
    }
    orderStore.state.editOrderInfo = order;
    dialogStore.openDialog("MarketOrderEditVisible");
  };

  const $reset = () => {
    Object.entries(state.marketLines).forEach(([chartId, lines]) => {
      lines.forEach((item) => item.line.remove());
      state.marketLines[chartId] = [];
    });

    state.marketLines = {};
    state.pendingLines = {};
    state.slLines = {};
    state.tpLines = {};
  };

  return {
    clickLine,
    state,
    $reset,
  };
});
