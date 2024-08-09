import request from "utils/http";
import { UserInfo } from "#/store";

enum Api {
  Login = "/login",
  LoginInfo = "/my/login_info",
  PasswordReset = "/my/password_update",
  QueryTradeLine = "/server/queryTradeLine",
  Register = "/my/sign_up",
  QueryNode = "/server/queryNode",
}

interface reqLogin {
  login: number;
  password: string;
  server: string;
}
interface reqLoginInfo {
  login: string;
}
/**
 * 登录
 */
export const Login = (data: reqLogin) => {
  return request<{ token: string }>({
    url: Api.Login,
    method: "post",
    data,
  });
};

interface reqRegister {
  server: string; //	经纪商交易线路编码
  email: string; //	邮箱
  verify_code: string; //	验证码 目前只支持 888888
}
interface resRegister {
  login: string;
  password: string;
}
// 注册
export const register = (data: reqRegister) => {
  return request<resRegister>({
    url: Api.Register,
    method: "post",
    data,
    urlType: "admin",
  });
};


/**
 * 登录信息
 */
export const getLoginInfo = (data: reqLoginInfo) => {
  return request<UserInfo>({
    url: Api.LoginInfo,
    method: "post",
    data,
    needToken: true,
  });
};

interface reqPasswordReset {
  admin_password: string;
  new_password: string;
}
// 重置用户密码
export const passwordReset = (data: reqPasswordReset) => {
  return request<any>({
    url: Api.PasswordReset,
    method: "post",
    data,
    needToken: true,
  });
};

export interface reqQueryTradeLine {
  lineName?: string; // 交易线路名称
  // brokerName: string; // 经纪商名称
}

export interface resQueryTradeLine {
  lineName: string; // 交易线路名称
  brokerName: string; // 经纪商名称
  lineLogo: string; // 显示图像
  brokerCode: string; // 经纪商编码
  lineCode: string; // 交易线路编码
}

// 查询所有交易线路
export const queryTradeLine = (data: reqQueryTradeLine) => {
  return request<resQueryTradeLine[]>({
    url: Api.QueryTradeLine,
    method: "post",
    data,
    noNeedServer: true,
    urlType: "admin",
  });
};

export interface resQueryNode {
  nodeName: string; //	交易系统节点名称
  ip: string; //	IP
  appApi: string; //	app_api
  appWebsocket: string; //	app_websocket
  webApi: string; //	web_api
  webWebsocket: string; //	web_websocket
  managerApi: string; //	manager_api
  managerWebsocket: string; //	manager_websocket
}
// 查询交易节点
export const queryNode = (data: { lineCode: string }) => {
  return request<resQueryNode[]>({
    url: Api.QueryNode,
    method: "post",
    data,
    urlType: "admin",
    noNeedServer: true,
  });
};
