import { defineStore } from "pinia";

import { generateUUID } from "@/utils/common";
import { versionQuery, IReqVersion } from "api/other";
import { useDialog } from "./dialog";

interface IState {
  deviceId: string;
  versionInfo: IReqVersion | null;
}
interface IGetUpdate {
  status: number[];
  ifCheckFrequency?: boolean;
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
    async getUpdate(params?: IGetUpdate) {
      // if (!process.env.IF_ELECTRON) {
      //   return;
      // }

      const state = await window.electronAPI.invoke("check-download-status");

      if (state) {
        // 自动恢复下载
        useDialog().openDialog("updateNoticeVisible");
        // @ts-ignore
        window.electronAPI.invoke("start-download", state.downloadUrl);
        return;
      }

      let status = [-1, 0, 1, 2];
      let ifCheckFrequency = false;

      if (params) {
        status = params.status;
        ifCheckFrequency = params.ifCheckFrequency || false;
      }

      const upDateStamp = localStorage.getItem("upDateStamp");
      if (upDateStamp && ifCheckFrequency) {
        const currentTime = new Date().getTime();
        const startTime = JSON.parse(upDateStamp);
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
        const timeDifference = currentTime - startTime;
        if (timeDifference < oneDayInMilliseconds) {
          return;
        }
      }

      let type = 0;
      const res = await versionQuery();
      if (res.data) {
        this.versionInfo = res.data;
        type = res.data.updateType;
        if (res.data.tipsFrequency === 1) {
          localStorage.setItem("upDateStamp", new Date().getTime().toString());
        } else {
          localStorage.removeItem("upDateStamp");
        }
      }
      if (status.includes(type)) {
        useDialog().openDialog("updateVersionVisible");
      }
    },
  },
});
