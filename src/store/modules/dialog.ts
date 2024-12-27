import { defineStore } from "pinia";

interface FloatMenuParams {
  visible: boolean;
  clientX: number;
  clientY: number;
}

interface State {
  orderDialogVisible: boolean; // 订单弹窗的显示
  floatMenuParams: FloatMenuParams; // 订单线加号按钮菜单
  disclaimers: boolean; // 快捷交易声明弹窗
  feedbackVisible: boolean; // 我的反馈弹窗
  // zIndexList: number[]; // z-index控制
  zIndex: number;
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
      zIndex: 10,
    };
  },
  actions: {
    showOrderDialog() {
      this.orderDialogVisible = true;
    },
    closeOrderDialog() {
      this.orderDialogVisible = false;
    },
    incrementZIndex() {
      this.zIndex++;
    },
  },
});
