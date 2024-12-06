import { defineStore } from "pinia";
interface State {
  systemSize: "small" | "default" | "large";
}

export const useSize = defineStore("size", {
  state: (): State => ({
    systemSize: "default",
  }),
  actions: {
    initSize() {
      const stoSize = localStorage.getItem("fontSize") as State["systemSize"];
      this.systemSize = stoSize || "default";
      document.documentElement.setAttribute("data-size", this.systemSize);
    },

    changeSize(size: State["systemSize"], temporary?: boolean) {
      document.documentElement.setAttribute("data-size", size);
      this.systemSize = size;
      if (!temporary) localStorage.setItem("fontSize", size);
    },
  },
});
