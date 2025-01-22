import request from "utils/http";

enum Api {
  Action = "/track/track/user/action",
}

type TAction =
  | "enter"
  | "back"
  | "slide"
  | "click"
  | "search"
  | "open"
  | "signUp";

interface ITrackAction {
  actionId: string; // 	行为ID,前端生成不同的唯一ID
  userId: string; // 	用户ID 无则传：anonymous
  actionTime: number; //	行为发生的时间 时间戳(毫秒级)
  actionType: TAction; // 	行为类型 目前只有五种：enter，back，slide，click ，search, open，signUp
  actionObject: string; // 	行为对象 用户操作的具体对象，如页面名称、按钮名称、搜索框等
  actionValue?: string; // 	行为对象具体的值 行为的数值表示，如浏览时长、搜索框的值等（可选）
  deviceId: string; // 	设备唯一标识
  appMarket?: string; // 	应用市场标识
  userAgent: string; // 	Http请求中的User-Agent
  location?: string; // 	用户的地理位置信息
  ipAddress?: string; // 	用户IP地址
  properties?: {
    prePage: string; //  上一个页面 （可选）
    deviceType: string; //  设备类型 如 ： mobile （可选）
    deviceModel: string; //  设备型号：如iPhone 14 （可选）
    deviceInfo: string; //  如操作系统、浏览器版本等
    appVersion: string; //  应用版本 如 “3.2.1”
    latitude: string; //  纬度 39.9042 （可选）
    longitude: string; //  经度 116.4074 （可选）
    deviceBrand: string; //  设备品牌
    platform: string; //  平台 如：Android, iOS, WEB
    server: string; //  交易服务器名称
  }; // Map	用户行为信息 Map
}

export const trackAction = (data: ITrackAction) => {
  return request({
    url: Api.Action,
    method: "post",
    data,
    urlType: "admin",
    noNeedToken: true,
  });
};
