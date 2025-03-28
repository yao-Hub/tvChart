import { defineStore } from "pinia";

interface FloatMenuParams {
  visible: boolean;
  clientX: number;
  clientY: number;
}

interface IState {
  orderDialogVisible: boolean; // 订单弹窗的显示
  floatMenuParams: FloatMenuParams; // 订单线加号按钮菜单
  disclaimersVisible: boolean; // 快捷交易声明弹窗
  feedbackVisible: boolean; // 我的反馈弹窗
  zIndex: number;
}

type TVisible = "orderDialogVisible" | "disclaimersVisible" | "feedbackVisible";

export const useDialog = defineStore("dialog", {
  state: (): IState => {
    return {
      disclaimersVisible: false,
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
    openDialog(type: TVisible) {
      this.incrementZIndex();
      this[type] = true;
    },
    closeDialog(type: TVisible) {
      this[type] = false;
    },
    incrementZIndex() {
      this.zIndex++;
    },
  },
});
