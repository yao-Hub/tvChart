import { defineStore } from "pinia";

interface FloatMenuParams {
  visible: boolean;
  clientX: number;
  clientY: number;
}

interface State {
  orderDialogVisible: boolean;
  floatMenuParams: FloatMenuParams;
  disclaimers: boolean;
  feedbackVisible: boolean;
}

export const useDialog = defineStore("dialog", {
  state: (): State => {
    return {
      disclaimers: false,
      orderDialogVisible: false, // 订单弹窗
      feedbackVisible: false,
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
  },
});
