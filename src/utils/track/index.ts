import { useUser } from "@/store/modules/user";
import { useVersion } from "@/store/modules/version";
import { TAction, trackAction } from "api/track/index";

interface ITrackAgre {
  actionType: TAction;
  actionObject: string;
}

export function sendTrack(params: ITrackAgre) {
  const { actionType, actionObject } = params;
  const versionStore = useVersion();
  const actionId = versionStore.deviceId;
  const actionTime = new Date().getTime();
  const deviceId = window.localStorage.getItem("uuid") as string;
  const userAgent = navigator.userAgent;
  const userStore = useUser();
  const loginInfo = userStore.loginInfo;
  const userId = loginInfo?.login || "anonymous";
  const updata = {
    actionId,
    actionTime,
    userId: userId.toString(),
    actionType,
    actionObject,
    deviceId,
    userAgent,
  };
  trackAction(updata);
}
