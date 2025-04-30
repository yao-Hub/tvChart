import { defineStore } from "pinia";
import { ElMessageBox } from "element-plus";

import { generateUUID } from "@/utils/common";
import { versionQuery, IReqVersion } from "api/other";
import { useDialog } from "./dialog";

import i18n from "@/language/index";

interface IState {
  deviceId: string;
  versionInfo: IReqVersion | null;
  updateInfo: {
    progress: number;
    status: "success" | "downloading" | "error" | "none" | "stop";
  };
}
interface IGetUpdate {
  status: number[];
  ifCheckFrequency?: boolean;
}
export const useVersion = defineStore("version", {
  state: (): IState => ({
    deviceId: "",
    versionInfo: null,
    updateInfo: {
      progress: 0,
      status: "none",
    },
  }),
  actions: {
    changeVerisonToNum(strVersion: string) {
      return +strVersion.split(".").join("");
    },
    getDeviceId() {
      this.deviceId = window.localStorage.getItem("uuid") || generateUUID();
      window.localStorage.setItem("uuid", this.deviceId);
    },
    /** 应用更新
     * step 1.服务器获取更新
     * step 2.服务器有无数据
     *        a.无数据：删除缓存文件
     *        b.有数据：下一步
     * step 3.查找缓存文件
     *        a.有缓存：检查地址是否和服务器地址一样
     *          i.一样：根据缓存状态进行继续下载or安装 done
     *          ii.不一样：删除缓存。下一步
     *        b.无缓存：下一步
     * step 4.是否强制更新：
     *        a.是：弹窗
     *        b.否：检查频率
     *          i.一天一次: 时间戳比对决定是否弹窗 done
     *          ii.每次启动: 直接弹窗 done
     */
    async getUpdate(params?: IGetUpdate) {
      if (!process.env.IF_ELECTRON) {
        return;
      }

      this.updateInfo.status = "none";
      this.updateInfo.progress = 0;

      let status = [-1, 0, 1, 2];
      // 是否自动触发检查更新（app启动时自动触发）
      let ifCheckFrequency = false;

      if (params) {
        status = params.status;
        ifCheckFrequency = params.ifCheckFrequency || false;
      }

      let type = 0;
      const res = await versionQuery();
      // 服务器有数据;
      if (res.data) {
        this.versionInfo = res.data;
        type = res.data.updateType;
        const url = res.data.downloadUrl;
        const state: any = await window.electronAPI.invoke(
          "check-download-status",
          url
        );
        /* -----有缓存---- */
        if (state) {
          if (state.completed) {
            window.electronAPI.invoke("start-install", url);
            return;
          }
          if (!state.completed) {
            useDialog().openDialog("updateProgressVisible");
            window.electronAPI.invoke("start-download", url);
            return;
          }
        }
        /* ----无缓存--- */
        if (
          res.data.updateType === 1 &&
          ifCheckFrequency &&
          res.data.tipsFrequency === "1"
        ) {
          // 非强制更新 一天提示一次 自动检查更新（非手动触发）
          const upDateStamp = localStorage.getItem("upDateStamp");
          if (upDateStamp) {
            const currentTime = new Date().getTime();
            const startTime = JSON.parse(upDateStamp);
            const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
            const timeDifference = currentTime - startTime;
            if (timeDifference < oneDayInMilliseconds) {
              return;
            }
          } else {
            localStorage.setItem(
              "upDateStamp",
              JSON.stringify(new Date().getTime())
            );
          }
        }
      } else {
        // 服务器无数据;
        window.electronAPI.invoke("clear-download-cache");
        localStorage.removeItem("upDateStamp");
      }
      // 其他的直接弹窗
      if (status.includes(type)) {
        useDialog().openDialog("updateVersionVisible");
      }
    },

    subUpdate() {
      if (!process.env.IF_ELECTRON) {
        return;
      }
      window.electronAPI?.on("download-progress", (progressData) => {
        this.updateInfo.status = "downloading";
        this.updateInfo.progress = progressData.progress;
      });
      window.electronAPI?.on("download-completed", () => {
        this.updateInfo.status = "success";
        this.updateInfo.progress = 100;
        setTimeout(
          () => useDialog().closeDialog("updateProgressVisible"),
          3000
        );
      });
      window.electronAPI?.on("download-error", () => {
        this.updateInfo.status = "error";
        setTimeout(
          () => useDialog().closeDialog("updateProgressVisible"),
          3000
        );
      });
      window.electronAPI?.on("download-stop", () => {
        this.updateInfo.status = "stop";
      });

      // 拦截浏览器刷新
      window.addEventListener("keydown", (e) => {
        if (this.updateInfo.status === "downloading") {
          // 拦截 Ctrl+R / F5
          if ((e.ctrlKey && e.key === "r") || e.key === "F5") {
            e.preventDefault();
            ElMessageBox.alert(i18n.global.t("update.downloading"));
          }
        }
      });

      window.addEventListener("beforeunload", (e) => {
        if (this.updateInfo.status === "downloading") {
          e.preventDefault();
          ElMessageBox.alert(i18n.global.t("update.downloading"));
        }
      });
    },
  },
});
