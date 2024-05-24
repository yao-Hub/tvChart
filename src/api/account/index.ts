import request from 'utils/http'

enum Api {
  Login = 'login'
}

interface Login {
  server: string
  login: number
  password: string
}

/**
 * 获取交易商线路的所有交易品种
 */
export const login = (data:Login) => {
  return request<{token: string}>({
    url: Api.Login,
    method: 'post',
    data
  })
}
