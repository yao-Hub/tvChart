import { defineStore } from "pinia";
import { useStorage } from "./storage";

interface IState {
  chartsVisable: boolean;
  symbolsVisable: boolean;
  orderAreaVisable: boolean;
}

export const useLayout = defineStore("layout", {
  state: (): IState => {
    return {
      chartsVisable: true,
      symbolsVisable: true,
      orderAreaVisable: true,
    };
  },

  actions: {
    initLayout() {
      const storageStore = useStorage();
      const layout = storageStore.getItem("layout");
      if (layout) {
        const {
          symbolsVisable = true,
          orderAreaVisable = true,
          chartsVisable = true,
        } = layout;
        this.symbolsVisable = symbolsVisable;
        this.orderAreaVisable = orderAreaVisable;
        this.chartsVisable = chartsVisable;
      } else {
        this.symbolsVisable = true;
        this.orderAreaVisable = true;
        this.chartsVisable = true;
      }
    },
    rememberLayout() {
      const storageStore = useStorage();
      const obj = {
        symbolsVisable: this.symbolsVisable,
        orderAreaVisable: this.orderAreaVisable,
        chartsVisable: this.chartsVisable,
      };
      storageStore.setItem("layout", obj);
    },
  },
});
