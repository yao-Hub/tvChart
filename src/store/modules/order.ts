import { defineStore } from 'pinia';
import { useDialog } from './dialog';
import { useChartAction } from './chartAction';
import { useUser } from './user';

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
}

export const useOrder = defineStore('order', {
  state(): State {
    return {
      currentQuote: null,
      currentSymbol: ''
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