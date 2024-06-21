import { defineStore } from 'pinia';
import { useDialog } from './dialog';
import { useChartAction } from './chartAction';
import { useUser } from './user';
import * as types from '#/chart/index';
import * as orderTypes from '#/order';
import { Modal } from 'ant-design-vue';

const dialogStore = useDialog();
const chartActionStore = useChartAction();
const userStore = useUser();

interface State {
  currentQuotes: Record<string, types.Quote>
  currentSymbol: string
  currentKline: types.Line | null
  refreshOrderArea: boolean
  tableData: orderTypes.TableData
}

export const useOrder = defineStore('order', {
  state(): State {
    return {
      currentQuotes: {},
      currentSymbol: '',
      currentKline: null,
      refreshOrderArea: false,
      tableData: {}
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