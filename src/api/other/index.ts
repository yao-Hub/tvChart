import request from "utils/http";

enum Api {
  Version = "/admin/version/version_query",
}

export interface IReqVersion {
  version: string; //	版本号
  versionCode: number; //	是否是更新的版本
  tips: string; //	升级提示语
  tipsFrequency: string; //	提示频率 1:一天一次,2:每次打开
  updateType: number; //	升级类型（1:非强制更新 、2:强制更新)
  downloadUrl: string; //	版本地址
}

export const versionQuery = () => {
  return request<IReqVersion>({
    url: Api.Version,
    method: "post",
    urlType: "admin",
    needLogin: true,
  });
};
