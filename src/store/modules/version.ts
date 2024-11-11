import { defineStore } from "pinia";

interface State {
  version: string;
}
export const useVersion = defineStore("version", {
  state: (): State => ({
    // @ts-ignore
    version: _VERSION_,
  }),
  actions: {
    checkVersion() {
      const nowVer = localStorage.getItem("version");
      if (!nowVer || nowVer !== this.version) {
        localStorage.clear();
        this.setVersion();
      }
    },
    setVersion() {
      localStorage.setItem("version", this.version);
    },
  },
});
