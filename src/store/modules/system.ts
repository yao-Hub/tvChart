import { defineStore } from "pinia";
import { ref } from "vue";
import { generateUUID } from "@/utils/common";
import axios from "axios";

export const useSystem = defineStore("system", () => {
  interface ISystemInfo {
    deviceModel: string;
    deviceBrand: string;
    platform: string;
    deviceInfo: string;
    deviceId: string;
    localIp: string;
  }

  const systemInfo = ref<ISystemInfo>();

  // 浏览器信息
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;

    // 判断是否为Chrome浏览器
    if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
      const chromeIndex = userAgent.indexOf("Chrome");
      return userAgent.slice(chromeIndex, userAgent.indexOf(" ", chromeIndex));
    }

    // 判断是否为Firefox浏览器
    if (/Firefox/.test(userAgent)) {
      const firefoxIndex = userAgent.indexOf("Firefox");
      return userAgent.slice(
        firefoxIndex,
        userAgent.indexOf(" ", firefoxIndex)
      );
    }

    // 判断是否为Safari浏览器
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      const safariIndex = userAgent.indexOf("Safari");
      return userAgent.slice(safariIndex, userAgent.indexOf(" ", safariIndex));
    }

    // 判断是否为Edge浏览器
    if (/Edge/.test(userAgent)) {
      const edgeIndex = userAgent.indexOf("Edge");
      return userAgent.slice(edgeIndex, userAgent.indexOf(" ", edgeIndex));
    }

    // 判断是否为IE浏览器
    if (/Trident/.test(userAgent) || /MSIE/.test(userAgent)) {
      let version = "unknown version";
      // 从"rv:"中提取IE 11+版本号
      const tridentVersion = userAgent.match(/rv:(\d+\.\d+)/);
      // 从"MSIE"中提取旧版本号
      const msieVersion = userAgent.match(/MSIE (\d+\.\d+)/);

      if (tridentVersion) {
        version = tridentVersion[1];
      } else if (msieVersion) {
        version = msieVersion[1];
      }
      return `IE/${version}`;
    }

    return "unknown browser/unknown version";
  };

  const getSystemInfo = async () => {
    if (systemInfo.value) {
      return;
    }
    const res = await axios.get("https://ipv4.icanhazip.com/");
    const localIp = res.data;
    // 桌面应用拿操作系统信息
    if (process.env.IF_ELECTRON) {
      const info: any = await window.electronAPI.invoke("get-system-info");
      try {
        const { uuid, model, os, release } = info;
        systemInfo.value = {
          deviceId: uuid,
          deviceBrand: model.split(" ")[0],
          deviceModel: model.split(" ").slice(1).join(" "),
          platform: os,
          deviceInfo: release,
          localIp,
        };
        return;
      } catch (error) {
        console.error("Failed to get device info:", error, info);
      }
    }
    // 浏览器拿浏览器信息
    const browerInfo = getBrowserInfo();
    const brower = browerInfo.split("/")[0];
    const browerVersion = browerInfo.split("/")[1];
    const stoId = window.localStorage.getItem("uuid");
    let deviceId = stoId || generateUUID();

    systemInfo.value = {
      deviceBrand: brower,
      deviceModel: browerVersion,
      platform: WEB_PLATFORM,
      deviceInfo: WEB_RELEASE,
      deviceId,
      localIp,
    };
  };

  function $reset() {}

  return { getSystemInfo, systemInfo, $reset };
});
