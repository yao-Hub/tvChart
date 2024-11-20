import { defineStore } from "pinia";
import { useStorage } from "./storage";

interface State {
  nowSize: string;
}

export const useSize = defineStore("size", {
  state: (): State => ({
    nowSize: "medium",
  }),
  actions: {
    initSize() {
      const storageStore = useStorage();
      const stoSize = storageStore.getItem("fontSize");
      if (stoSize) {
        this.nowSize = stoSize;
      }
      document.documentElement.setAttribute("data-size", this.nowSize);
    },

    changeSize(size: string) {
      const storageStore = useStorage();
      document.documentElement.setAttribute("data-size", size);
      storageStore.setItem("fontSize", size);
      this.nowSize = size;
    },
  },
});
