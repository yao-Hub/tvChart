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
    changeVerisonToNum(strVersion: string) {
      return +strVersion.split(".").join("");
    },
    getDeviceId() {
      this.deviceId = window.localStorage.getItem("uuid") || generateUUID();
      window.localStorage.setItem("uuid", this.deviceId);
      return this.deviceId;
    },
    async checkVersion() {
      const nowVer = localStorage.getItem("version");
      if (!nowVer) {
        this.setVersion();
      } else {
        // todo 版本更新兼容
        //   const nowVerNum = this.changeVerisonToNum(nowVer);
        //   if (nowVerNum < 131) {
        //     const databases = await indexedDB.databases();
        //     const deletionPromises = databases.map((database) => {
        //       if (database.name) {
        //         indexedDB.deleteDatabase(database.name);
        //       }
        //     });
        //     // 等待所有删除操作完成
        //     await Promise.all(deletionPromises);
        //   }
        //   this.setVersion();
      }
    },
    setVersion() {
      localStorage.setItem("version", this.version);
    },
  },
});
