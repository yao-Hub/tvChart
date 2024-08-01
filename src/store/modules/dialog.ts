import { defineStore } from "pinia";

interface FloatMenuParams {
  visible: boolean;
  clientX: number;
  clientY: number;
}

interface State {
  orderDialogVisible: boolean;
  floatMenuParams: FloatMenuParams;
  loginDialogVisible: boolean;
}

export const useDialog = defineStore("dialog", {
  state: (): State => {
    return {
      loginDialogVisible: false, // 登录弹窗
      orderDialogVisible: false, // 订单弹窗
      floatMenuParams: {
        visible: false,
        clientX: 0,
        clientY: 0,
      },
    };
  },
  actions: {
    showOrderDialog() {
      this.orderDialogVisible = true;
    },
    closeOrderDialog() {
      this.orderDialogVisible = false;
    },
    showLoginDialog() {
      this.loginDialogVisible = true;
    },
    closeLoginDialog() {
      this.loginDialogVisible = false;
    },
  },
});
