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
        this.symbolsVisable = layout.symbolsVisable;
        this.orderAreaVisable = layout.orderAreaVisable;
      } else {
        this.symbolsVisable = true;
        this.orderAreaVisable = true;
      }
    },
    rememberLayout() {
      const storageStore = useStorage();
      const obj = {
        symbolsVisable: this.symbolsVisable,
        orderAreaVisable: this.orderAreaVisable,
      };
      storageStore.setItem("layout", obj);
    },
  },
});
