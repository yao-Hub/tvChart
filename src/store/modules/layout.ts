import { defineStore } from 'pinia';

interface State {
  chartsVisable: boolean;
  symbolsVisable: boolean;
  orderAreaVisable: boolean;
}

export const useLayout = defineStore('layout', {
  state(): State {
    return {
      chartsVisable: true,
      symbolsVisable: true,
      orderAreaVisable: true,
    };
  },
});
