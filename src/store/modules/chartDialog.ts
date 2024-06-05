import { defineStore } from 'pinia'

interface FloatMenuParams {
  visible: boolean
  clientX: number
  clientY: number
}

interface State {
  orderDialogShow: Boolean
  floatMenuParams: FloatMenuParams
}

const chartDialogStore = defineStore('chartDialogStore', {
  state(): State {
    return {
      orderDialogShow: false,
      floatMenuParams: {
        visible: false,
        clientX: 0,
        clientY: 0
      }
    }
  },
  actions: {
    showOrderDialog() {
      this.orderDialogShow = true;
    },
    closeOrderDialog() {
      this.orderDialogShow = false;
    }
  }
})

export default chartDialogStore
