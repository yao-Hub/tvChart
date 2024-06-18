import { defineStore } from 'pinia';
import { useDialog } from './dialog';
import { useChartAction } from './chartAction';
import { useUser } from './user';
import * as types from '#/chart/index';
import { Modal } from 'ant-design-vue';

const dialogStore = useDialog();
const chartActionStore = useChartAction();
const userStore = useUser();

interface State {
  currentQuote: types.Quote | null
  currentSymbol: string
  currentKline: types.Line | null
  refreshOrderArea: boolean
  polling: boolean // 是否轮询个人信息和持仓单
}

export const useOrder = defineStore('order', {
  state(): State {
    return {
      currentQuote: null,
      currentSymbol: '',
      currentKline: null,
      refreshOrderArea: false,
      polling: false
    }
  },

  actions: {
    createOrder() {
      if (!userStore.getToken()) {
        dialogStore.showLoginDialog();
        chartActionStore.setCacheAction('createOrder');
        return;
      }
      if (userStore.loginInfo?.trade_rights !== 1) {
        Modal.error({
          title: '无权限',
          content: '当前账户禁止交易',
        });
        return;
      }
      dialogStore.showOrderDialog();
    }
  }
})