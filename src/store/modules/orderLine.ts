import { defineStore } from "pinia";
import { useChartInit } from "./chartInit";
import { useOrder } from "./order";
import { computed, reactive, watch } from "vue";
import * as Library from "public/charting_library";

type TPositionLine = Record<string | number, Library.IPositionLineAdapter>;

type TOrderLine = Record<string | number, Library.IOrderLineAdapter>;

interface IState {
  marketLines: Record<`chart_${number}`, TPositionLine>;
  pendingLines: Record<`chart_${number}`, TOrderLine>;
  slLines: Record<`chart_${number}`, TOrderLine>;
  tpLines: Record<`chart_${number}`, TOrderLine>;
}

export const useOrderLine = defineStore("orderLine", () => {
  const chartInitStore = useChartInit();
  const orderStore = useOrder();

  const chartList = computed(() => chartInitStore.state.chartWidgetList);
  const marketOrder = computed(() => orderStore.state.orderData.marketOrder);
  const pendingOrder = computed(() => orderStore.state.orderData.pendingOrder);
  const marketOrderHistory = computed(
    () => orderStore.state.orderData.marketOrderHistory
  );

  watch(
    () => [marketOrder, chartList],
    () => {
      if (!marketOrder.value.length || !chartList.value.length) {
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
      if (!pendingOrder.value.length || !chartList.value.length) {
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
      if (!marketOrderHistory.value.length || !chartList.value.length) {
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
  });

  // 绘制市价单线
  const drawMarketOrderLine = () => {};

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

  return {
    clickLine,
    state,
  };
});
