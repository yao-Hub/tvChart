import { defineStore } from "pinia";

interface FloatMenuParams {
  visible: boolean;
  clientX: number;
  clientY: number;
}

interface IState {
  visibles: Record<TVisible, boolean>;
  floatMenuParams: FloatMenuParams; // 订单线加号按钮菜单
  zIndex: number;
}

type TVisible =
  // 订单弹窗
  | "orderDialogVisible"
  // 快捷交易声明弹窗
  | "disclaimersVisible"
  // 我的反馈弹窗
  | "feedbackVisible"
  // 版本提示更新弹窗
  | "updateVersionVisible"
  // 下载进度弹窗
  | "updateProgressVisible"
  // 交易服务器详情弹窗
  | "serverVisible";

export const useDialog = defineStore("dialog", {
  state: (): IState => {
    return {
      visibles: {
        disclaimersVisible: false,
        orderDialogVisible: false,
        feedbackVisible: false,
        updateVersionVisible: false,
        updateProgressVisible: false,
        serverVisible: false,
      },
      floatMenuParams: {
        visible: false,
        clientX: 0,
        clientY: 0,
      },
      zIndex: 10,
    };
  },
  actions: {
    getMaxZIndex() {
      let maxZIndex = 0;
      const allElements = document.getElementsByTagName("*");
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        const zIndex = parseInt(window.getComputedStyle(element).zIndex);
        if (!isNaN(zIndex) && zIndex > maxZIndex) {
          maxZIndex = zIndex;
        }
      }
      return maxZIndex;
    },

    openDialog(type: TVisible) {
      this.incrementZIndex();
      this.visibles[type] = true;
    },
    closeDialog(type: TVisible) {
      this.visibles[type] = false;
    },
    incrementZIndex() {
      const maxZIndex = this.getMaxZIndex();
      this.zIndex = maxZIndex + 1;
    },
    $reset() {
      for (const i in this.visibles) {
        if (["updateVersionVisible", "updateProgressVisible"].includes(i)) {
          break;
        }
        this.visibles[i as TVisible] = false;
      }
      this.floatMenuParams = {
        visible: false,
        clientX: 0,
        clientY: 0,
      };
      this.zIndex = 10;
    },
  },
});
