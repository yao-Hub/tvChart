import { generateUUID } from "@/utils/common";
import { defineStore } from "pinia";

interface IState {
  version: string;
  deviceId: string;
}
export const useVersion = defineStore("version", {
  state: (): IState => ({
    // @ts-ignore
    version: _VERSION_,
    deviceId: "",
  }),
  actions: {
    getDeviceId() {
      this.deviceId = window.localStorage.getItem("uuid") || generateUUID();
      window.localStorage.setItem("uuid", this.deviceId);
    },
    checkVersion() {
      const nowVer = localStorage.getItem("version");
      if (!nowVer || nowVer !== this.version) {
        // localStorage.clear();
        this.setVersion();
      }
    },
    setVersion() {
      localStorage.setItem("version", this.version);
    },
  },
});
