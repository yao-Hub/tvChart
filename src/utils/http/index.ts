import axios, { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { CustomResponseType } from '#/axios'
import { encrypt, decrypt } from 'utils/DES/index'
import { notification, message } from 'ant-design-vue';
import { useUser } from '@/store/modules/user';
import { useDialog } from '@/store/modules/dialog';

interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig<any> {
  needToken?: boolean;
}
interface CustomAxiosRequestConfig extends AxiosRequestConfig<any> {
  needToken?: boolean;
}
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
  (config: CustomInternalAxiosRequestConfig) => {
    const userStore = useUser();
    config.data = {
      ...config.data,
      server: 'upway-live'
    };
    if (config.needToken) {
      config.data.token = userStore.getToken();
      config.data.login = userStore.account.login;
    }
    console.log('request Data', { url: config.url, data: config.data })
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
      console.log('response Data', { url: response.config.url, data })
      return response;
    }
    const dialogStroe = useDialog();
    if (data.err === 1 && data.errmsg.includes('invalid token')) {
      const userStore = useUser();
      userStore.ifLogin = false;
      userStore.clearToken();
      userStore.loginInfo = null;
      
      dialogStroe.showLoginDialog();
      message['error']('登录过期，请重新登录');
      return Promise.reject(data)
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
  config: CustomAxiosRequestConfig
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

