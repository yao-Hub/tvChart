import { defineStore } from 'pinia';

interface State {
  ifQuick: boolean
}

export const useQuiTrans = defineStore('quiTrans', {
  state: (): State => {
    return {
      ifQuick: false
    };
  },
  actions: {
    setQuiTrans(result: boolean) {
      this.ifQuick = result;
      window.localStorage.setItem('ifQuiTrans', JSON.stringify(result));
    },
    getQuiTrans() {
      const result = window.localStorage.getItem('ifQuiTrans') || JSON.stringify(false);
      this.ifQuick = JSON.parse(result);
      return result;
    }
  },
});
