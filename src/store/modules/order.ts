import { defineStore } from 'pinia';
import { useDialog } from './dialog';
import { useChartAction } from './chartAction';
import { useUser } from './user';

const dialogStore = useDialog();
const chartActionStore = useChartAction();
const userStore = useUser();

interface State {}

export const useOrder = defineStore('order', {
  state(): State {
    return {}
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