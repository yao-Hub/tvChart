import { defineStore } from "pinia";
interface IState {
  systemSize: "small" | "default" | "large";
}

export const useSize = defineStore("size", {
  state: (): IState => ({
    systemSize: "default",
  }),
  actions: {
    initSize() {
      const stoSize = localStorage.getItem("fontSize") as IState["systemSize"];
      this.systemSize = stoSize || "default";
      document.documentElement.setAttribute("data-size", this.systemSize);
    },

    changeSize(size: IState["systemSize"], temporary?: boolean) {
      document.documentElement.setAttribute("data-size", size);
      this.systemSize = size;
      if (!temporary) localStorage.setItem("fontSize", size);
    },
  },
});
