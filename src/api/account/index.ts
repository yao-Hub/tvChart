import request from "utils/http";

enum Api {
  Login = "/login",
  Logout = "/login/logout",
  LoginInfo = "/my/login_info",
  PasswordReset = "/my/password_update",
  QueryTradeLine = "/admin/server/queryTradeLine",
  Register = "/admin/my/sign_up",
  QueryNode = "/admin/server/queryNode",
  VirtualLine = "/admin/my/virtual_line_query",
  EmailPasswordUpdate = "/admin/my/email_password_update",
  SendEmail = "/admin/my/sendEmail",
  ArticleDetails = "/admin/column/select_trade_column",
  ProtocolAgree = "/admin/protocol/protocol_agree",
  RefreshToken = "/login/refresh_token",
  BalanceAdd = "/admin/my/balance_add",
  QueryBroker = "/admin/server/queryBroker",
}
export interface Order {
  id: number; //	订单ID
  login: number; //	订单账户
  time_setup: number; //	订单创建时间，即记录插入时间。挂单成交后 time_setup 与 open_time 不一样
  symbol: string; //	订单交易商品
  digits: number; //	订单交易商品报价小数位数
  currency_digits: number; //	订单法币小数位数
  contract_size: number; //	订单商品合约数量
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
  login: number; //	查询的订单账户
  group: string; //	组别
  status: number; //	账户状态。0=禁用，1=启用
  trade_rights: number; //	交易权限。0=禁止，1=可交易，2=只读
  add_time: number; //	添加时间，时间戳毫秒级
  first_name: string; //	名
  last_name: string; //	姓
  mid_name: string; //	中间名
  total_name: string; //	全名
  country: string; //	国家/地区 编码
  language: string; //	语言编码
  agent_login: number; //	上级代理的login
  last_ip: string; //	最后IP
  currency: string; //	账户币种
  currency_digits: number; //(11)	法币小数位数
  balance: number; //	余额
  credit: number; //	信用额
  margin: number; //	已用保证金
  margin_free: number; //	可用保证金
  margin_level: number; //	保证金水平
  margin_leverage: number; //	杠杆倍数
  profit: number; //	持仓盈亏
  storage: number; //	持仓过夜费
  fee: number; //	持仓手续费
  equity: number; //	净值
  openning_orders: Order[];
  symbols_limit: string | null;
  email: string | null;
}

export interface reqLogin {
  login: number | string;
  password: string;
  server: string;
}
interface reqLoginInfo {
  login: string | string;
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

export const Logout = () => {
  return request({
    url: Api.Logout,
    method: "post",
    needLogin: true,
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
  return request({
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
  isOfficial: string; //	是否官方模拟服务器 0:否 1:是
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
export const queryNode = (data: { lineCode: string; lineName: string }) => {
  return request<resQueryNode[]>({
    url: Api.QueryNode,
    method: "post",
    data,
    urlType: "admin",
    noNeedToken: true,
    noNeedServer: true,
  });
};

// 1 注销 2 重置密码 不传：注册
export interface IReqSendEmail {
  email: string;
  type?: number;
}
export const sendEmail = (data: IReqSendEmail) => {
  return request({
    url: Api.SendEmail,
    method: "post",
    data,
    urlType: "admin",
    noNeedToken: true,
    noNeedServer: true,
  });
};

interface IReqArticle {
  columnCode: string; //	栏目编码
  articleCode?: string; // 文章编码
}
export const articleDetails = (data: IReqArticle) => {
  return request<{ url: string }>({
    url: Api.ArticleDetails,
    method: "post",
    data,
    urlType: "admin",
    noNeedToken: true,
    noNeedServer: true,
  });
};

interface IReqProtocolAgree {
  columnCodes: string[]; //	协议名称
  brokerName: string; //	经纪商
  lineName: string; //	交易线路
  login: string; //	登录名
  loginName?: string; //	姓名
}
export const protocolAgree = (data: IReqProtocolAgree) => {
  return request({
    url: Api.ProtocolAgree,
    method: "post",
    data,
    urlType: "admin",
    noNeedToken: true,
    noNeedServer: true,
  });
};

export const refresh_token = () => {
  return request<string>({
    url: Api.RefreshToken,
    method: "post",
    needLogin: true,
  });
};

interface IReqAddBalance {
  lineName: string; //	交易线路
  email: string; //	邮箱
  verify_code: string; //	验证码
  profit: number; //	入金金额
}
export const addBalance = (data: IReqAddBalance) => {
  return request({
    url: Api.BalanceAdd,
    method: "post",
    data,
    urlType: "admin",
    needLogin: true,
  });
};

interface IReqQueryBroker {
  brokerName: string;
}
export interface IResQueryBroker {
  brokerName: string; //	公司
  registrationCode: string; //	注册编号
  brokerAddress: string; //	注册地址
  regulatoryArea: string; //	监管
  officeAddress: string; //	办公室位置
  website: string; //	网站、网址
  generalEmail: string; //	通用电子邮件
  reportEmail: string; //	滥用报告电子邮件
  telephone: string; //	电话
}

export const queryBroker = (data: IReqQueryBroker) => {
  return request<IResQueryBroker>({
    url: Api.QueryBroker,
    method: "post",
    data,
    urlType: "admin",
  });
};
