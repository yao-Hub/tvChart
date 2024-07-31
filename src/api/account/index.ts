import request from 'utils/http'
import { UserInfo } from '#/store'

enum Api {
  Login = 'login',
  LoginInfo = 'my/login_info',
}

interface reqLogin {
  login: number
  password: string
}
interface reqLoginInfo {
  login: string
}
/**
 * 登录
 */
export const Login = (data: reqLogin) => {
  return request<{token: string}>({
    url: Api.Login,
    method: 'post',
    data
  })
}

/**
 * 登录信息
 */
export const getLoginInfo = (data: reqLoginInfo) => {
  return request<UserInfo>({
    url: Api.LoginInfo,
    method: 'post',
    data,
    needToken: true
  })
}

// 出入金
export const balanceOrdersAdd = (data: any) => {
  return request<any>({
    url: 'admin/balance_orders_add',
    method: 'post',
    data,
  })
}

// 查询账户列表
export const logins = (data: any) => {
  return request<any>({
    url: 'admin/logins',
    method: 'post',
    data,
  })
}

// 增加更新组别
export const groupAddUpdate = (data: any) => {
  return request<any>({
    url: 'admin/group_add_update',
    method: 'post',
    data,
  })
}

// 查询组别
export const groupGet = (data: any) => {
  return request<any>({
    url: 'admin/groups',
    method: 'post',
    data,
  })
}

// 添加账户
export const loginsAdd = (data: any) => {
  return request<any>({
    url: 'admin/logins_add',
    method: 'post',
    data,
  })
}

interface reqPasswordReset {
  admin_password: string
  new_password: string
}
// 重置用户密码
export const passwordReset = (data: reqPasswordReset) => {
  return request<any>({
    url: 'my/password_update',
    method: 'post',
    data,
    needToken: true
  })
}
