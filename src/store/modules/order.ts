import { defineStore } from 'pinia';
import { useDialog } from './dialog';
import { useChartAction } from './chartAction';
import { useUser } from './user';
import { Line } from '#/chart/index';

const dialogStore = useDialog();
const chartActionStore = useChartAction();
const userStore = useUser();

interface Quote {
  ask: number
  bid: number
  ctm: number
  ctm_ms: number
  server: string
  symbol: string
}
interface State {
  currentQuote: Quote | null
  currentSymbol: string
  currentKline: Line | null
}

export const useOrder = defineStore('order', {
  state(): State {
    return {
      currentQuote: null,
      currentSymbol: '',
      currentKline: null
    }
  },

  actions: {
    createOrder() {
      if (!userStore.getToken()) {
        dialogStore.showLoginDialog();
        chartActionStore.setCacheAction('createOrder');
        return;
      }
      dialogStore.showOrderDialog();
    }
  }
})