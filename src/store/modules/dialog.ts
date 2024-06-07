import { defineStore } from 'pinia'

interface FloatMenuParams {
  visible: boolean
  clientX: number
  clientY: number
}

interface State {
  orderDialogVisible: Boolean
  floatMenuParams: FloatMenuParams
  loginDialogVisible: Boolean
}

export const useDialog = defineStore('dialog', {
  state(): State {
    return {
      loginDialogVisible: false,
      orderDialogVisible: false,
      floatMenuParams: {
        visible: false,
        clientX: 0,
        clientY: 0
      }
    }
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
    }
  }
})
