import request from "utils/http";
import { UserInfo } from "#/store";

enum Api {
  Login = "login",
  LoginInfo = "my/login_info",
  PasswordReset = "my/password_update",
  QueryTradeLine = "server/queryTradeLine",
  Register = "my/sign_up",
}

interface reqLogin {
  login: number;
  password: string;
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

interface reqQueryTradeLine {
  lineName: string; // 交易线路名称
  // brokerName: string; // 经纪商名称
}

interface resQueryTradeLine {
  lineName: string; // 交易线路名称
  brokerName: string; // 经纪商名称
  lineLogo: string	// 显示图像
}

// 查询所有交易线路
export const queryTradeLine = (data: reqQueryTradeLine) => {
  return request<resQueryTradeLine>({
    url: Api.QueryTradeLine,
    method: "post",
    data,
    noNeedServer: true,
  });
};

// 注册
export const register = () => {
  return request<any>({
    url: Api.Register,
    method: "post",
    noNeedServer: true,
  });
};
