import { defineStore } from 'pinia';
import chartDialogStore from './chartDialog';

const chartDialog = chartDialogStore();

interface State {}

export default defineStore('orderStore', {
  state(): State {
    return {}
  },

  actions: {
    createOrder() {
      chartDialog.showOrderDialog();
    }
  }
})