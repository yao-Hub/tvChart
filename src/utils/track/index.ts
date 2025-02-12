import { useUser } from "@/store/modules/user";
import { useVersion } from "@/store/modules/version";
import { generateUUID } from "@/utils/common";
import { TAction, trackAction } from "api/track/index";

interface ITrackAgre {
  actionType: TAction;
  actionObject: string;
}

function getBrowserInfo() {
  const userAgent = navigator.userAgent;

  // 判断是否为Chrome浏览器
  if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
    const chromeIndex = userAgent.indexOf("Chrome");
    return userAgent.slice(chromeIndex, userAgent.indexOf(" ", chromeIndex));
  }

  // 判断是否为Firefox浏览器
  if (/Firefox/.test(userAgent)) {
    const firefoxIndex = userAgent.indexOf("Firefox");
    return userAgent.slice(firefoxIndex, userAgent.indexOf(" ", firefoxIndex));
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
    if (/Trident/.test(userAgent)) {
      return "IE 11+";
    } else {
      const ieIndex = userAgent.indexOf("MSIE");
      return userAgent.slice(ieIndex, userAgent.indexOf(";", ieIndex));
    }
  }

  return "unknow browser";
}

export function sendTrack(params: ITrackAgre) {
  const { actionType, actionObject } = params;
  const versionStore = useVersion();
  const actionId = generateUUID();
  const actionTime = new Date().getTime();
  const deviceId = versionStore.deviceId;
  const userAgent = navigator.userAgent;
  const userStore = useUser();
  const loginInfo = userStore.state.loginInfo;
  const userId = loginInfo?.login || "anonymous";
  const deviceBrand = getBrowserInfo();
  const updata = {
    actionId,
    actionTime,
    userId: userId.toString(),
    actionType,
    actionObject,
    deviceId,
    userAgent,
    properties: {
      // @ts-ignore
      deviceModel: _OS_HOSTNAME_,
      // @ts-ignore
      deviceInfo: _OS_RELEASE_,
      // @ts-ignore
      appVersion: _VERSION_,
      deviceBrand,
      platform: "WEB",
      server: userStore.account.server,
    },
  };
  trackAction(updata);
}
