import axios, { AxiosRequestConfig, AxiosError } from 'axios'
import type { CustomResponseType } from '#/axios'
import { encrypt, decrypt } from 'utils/DES/index'
import { notification } from 'ant-design-vue';

const baseURL = import.meta.env.MODE === 'development' ? import.meta.env.VITE_HTTP_BASE_URL : import.meta.env.VITE_HTTP_URL;
console.log(import.meta.env.MODE, baseURL)

const service = axios.create({
  baseURL,
  timeout: 30 * 1000,
  // 请求是否携带cookie
  withCredentials: false,
  headers: {
    "Content-Type": 'application/json',
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    console.log('request Data', config.data)
    var p = {
      action: config.url,
      d: encrypt(JSON.stringify(config.data))
    };
    config.data = JSON.stringify(p);
    return config
  },
  (err) => {
    return Promise.reject(err)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.err === 0) {
      data.data = JSON.parse(decrypt(data.data));
      console.log('response Data', data.data)
      return response;
    }
    notification['error']({
      message: 'error',
      description: data.errmsg || data.err || 'response error',
    });
    return Promise.reject(data)
  },
  (err) => {
    const { status } = err.response
    notification['error']({
      message: err.name || 'request error',
      description: err.message || `statusCode: ${status}`,
    });
    // 根据返回的http状态码做不同的处理，比如错误提示等 TODO
    switch (status) {
      case 401:
        // 鉴权失败
        break
      case 403:
        // 没有权限
        break
      case 500:
        // 服务端错误
        break

      default:
        break
    }
    return Promise.reject(err)
  }
)

// 封装一层以更好的统一定义接口返回的类型
const request = <T>(
  config: AxiosRequestConfig
): Promise<CustomResponseType<T>> => {
  return new Promise((resolve, reject) => {
    service
      .request<CustomResponseType<T>>(config)
      .then((res) => {
        resolve(res.data)
      })
      .catch((err: Error | AxiosError) => {
        reject(err)
      })
  })
}

export default request

