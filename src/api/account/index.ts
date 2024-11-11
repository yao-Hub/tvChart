import request from "utils/http";

enum Api {
  Login = "/login",
  LoginInfo = "/my/login_info",
  PasswordReset = "/my/password_update",
  QueryTradeLine = "/server/queryTradeLine",
  Register = "/my/sign_up",
  QueryNode = "/server/queryNode",
  VirtualLine = "/my/virtual_line_query",
  EmailPasswordUpdate = "/my/email_password_update",
}
export interface Order {
  id: number; //	订单ID
  login: number; //	订单账户
  time_setup: number; //	订单创建时间，即记录插入时间。挂单成交后 time_setup 与 open_time 不一样
  symbol: string; //	订单交易品种
  digits: number; //	订单交易品种报价小数位数
  currency_digits: number; //	订单法币小数位数
  contract_size: number; //	订单品种合约数量
  state: number; //	预留字段
  reason: string; //	预留字段
  time_expiration: number; //	过期时间。挂单创建后有效
  time_done: number; //	结束时间。订单彻底结束时间。如 持仓平仓、挂单删除
  type: number; //	做单方向。0 = buy, 1 = sell
  origin_type: number; //	原始的type值。如挂单 type = 2 buy limit 成交后 type 设置为0
  order_price: number; //	挂单价格
  trigger_price: number; //	触及价格
  status: number; //	状态。1 = 挂单中，2 = 已建仓，3 = 已平仓，4 = 已关闭
  open_price: number; //	建仓价格
  open_time: number; //	建仓时间
  from_id: number; //	源ID。如订单部分平仓时，就订单平仓对应手数并结束，余下手数自动生成新订单
  position_id: number; //	订单组ID。建仓时为id值。部分平仓时，position_id保持不变
  volume: number; //	手数
  sl_price: number; //	止损价
  tp_price: number; //	止盈价
  close_price: number; //	平仓价。持仓中唤作“最新价”更合适
  close_time: number; //	平仓时间
  storage: number; //	过夜费
  fee: number; //	手续费
  profit: number; //	浮动盈亏
  comment: string; //	备注评论
}
export interface UserInfo {
  username: string;
  password: string;
  login: string;
  group: string;
  status: number;
  trade_rights: number;
  add_time: number;
  first_name: string;
  last_name: string;
  mid_name: string;
  total_name: string;
  country: string;
  language: string;
  agent_login: number;
  last_ip: string;
  currency_digits: number;
  balance: number;
  credit: number;
  margin: number;
  margin_free: number;
  margin_level: number;
  margin_leverage: number;
  profit: number;
  storage: number;
  fee: number;
  equity: number;
  openning_orders: Order[];
}

export interface reqLogin {
  login: number | string;
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
    noNeedToken: true,
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
    noNeedToken: true,
    urlType: "admin",
  });
};

// 重置密码
interface reqPasswordUpdate {
  server: string; // 	经纪商交易线路编码
  email: string; // 	邮箱
  verify_code: string; // 	验证码 目前只支持 888888
  new_password: string; // 	新密码
  confirm_password: string; // 	新密码确认
}
export const emailPasswordUpdate = (data: reqPasswordUpdate) => {
  return request<{}>({
    url: Api.EmailPasswordUpdate,
    method: "post",
    data,
    noNeedToken: true,
    urlType: "admin",
  });
};

// 查询虚拟线路
export const virtualLine = () => {
  return request<resQueryTradeLine>({
    url: Api.VirtualLine,
    method: "post",
    urlType: "admin",
    noNeedToken: true,
    noNeedServer: true,
  });
};

/**
 * 登录信息
 */
export const loginInfo = (data: reqLoginInfo) => {
  return request<UserInfo>({
    url: Api.LoginInfo,
    method: "post",
    data,
    needLogin: true,
  });
};

interface reqPasswordReset {
  old_password: string;
  new_password: string;
}
// 重置用户密码
export const passwordReset = (data: reqPasswordReset) => {
  return request<any>({
    url: Api.PasswordReset,
    method: "post",
    data,
    needLogin: true,
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
    noNeedToken: true,
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
    noNeedToken: true,
    noNeedServer: true,
  });
};
