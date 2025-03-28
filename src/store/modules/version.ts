import { defineStore } from "pinia";
import { ElNotification } from "element-plus";

import { generateUUID } from "@/utils/common";
import { versionQuery, IReqVersion } from "api/other";
import { useDialog } from "./dialog";
import i18n from "@/language/index";

interface IState {
  deviceId: string;
  versionInfo: IReqVersion | null;
}
export const useVersion = defineStore("version", {
  state: (): IState => ({
    deviceId: "",
    versionInfo: null,
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
    // 获取更新
    async getUpdate(showStatusList: number[] = [-1, 0, 1, 2]) {
      if (!process.env.IF_ELECTRON) {
        return;
      }
      let type = -1;
      const res = await versionQuery();
      if (res.data) {
        this.versionInfo = res.data;
        type = res.data.updateType;
      }
      // useDialog().openDialog("updateVersionVisible");
      // return;
      if (showStatusList.includes(type)) {
        if (type === -1) {
          const t = i18n.global.t;
          ElNotification.warning(
            t("tip.failed", { type: t("update.getUpdate") })
          );
          return;
        }
        useDialog().openDialog("updateVersionVisible");
      }
    },
  },
});
