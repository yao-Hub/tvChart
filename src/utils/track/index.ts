// 行为打点
import { useUser } from "@/store/modules/user";
import { useSystem } from "@/store/modules/system";
import { generateUUID } from "@/utils/common";
import { TAction, trackAction } from "api/track/index";

interface ITrackAgre {
  actionType: TAction;
  actionObject: string;
}

export async function sendTrack(params: ITrackAgre) {
  const systemStore = useSystem();
  if (!systemStore.systemInfo) {
    await systemStore.getSystemInfo();
  }
  const { actionType, actionObject } = params;
  const actionId = generateUUID();
  const actionTime = new Date().getTime();
  const userAgent = navigator.userAgent;
  const userStore = useUser();
  const userId = userStore.account.login || "anonymous";
  const updata = {
    actionId,
    actionTime,
    userId: userId.toString(),
    actionType,
    actionObject,
    deviceId: systemStore.systemInfo!.deviceId,
    userAgent,
    properties: {
      appVersion: _VERSION_,
      deviceModel: systemStore.systemInfo!.deviceModel,
      deviceInfo: systemStore.systemInfo!.deviceInfo,
      deviceBrand: systemStore.systemInfo!.deviceBrand,
      platform: systemStore.systemInfo!.platform,
      server: userStore.account.server,
    },
  };
  await trackAction(updata);
}
