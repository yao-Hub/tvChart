import { defineStore } from "pinia";
import { useStorage } from "./storage";

interface State {
  systemSize: "small" | "default" | "large";
}

export const useSize = defineStore("size", {
  state: (): State => ({
    systemSize: "default",
  }),
  actions: {
    initSize() {
      const storageStore = useStorage();
      const stoSize = storageStore.getItem("fontSize");
      if (stoSize) {
        this.systemSize = stoSize;
      }
      document.documentElement.setAttribute("data-size", this.systemSize);
    },

    changeSize(size: State["systemSize"], temporary?: boolean) {
      const storageStore = useStorage();
      document.documentElement.setAttribute("data-size", size);
      this.systemSize = size;
      if (!temporary) storageStore.setItem("fontSize", size);
    },
  },
});
