import axios, {
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import type { CustomResponseType } from "#/axios";
import { encrypt, decrypt } from "utils/DES/JS";
import { aes_decrypt, aes_encrypt } from "utils/DES/Node";
import { notification, Modal } from "ant-design-vue";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

interface CustomInternalAxiosRequestConfig
  extends InternalAxiosRequestConfig<any> {
  needToken?: boolean;
  noNeedServer?: boolean;
  action?: string;
  urlType?: string;
}
interface CustomAxiosRequestConfig extends AxiosRequestConfig<any> {
  needToken?: boolean;
  noNeedServer?: boolean;
  action?: string;
  urlType?: string;
}

let ifTokenError = false;

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
let uuid;
const storageId = window.localStorage.getItem("uuid");
if (storageId) {
  uuid = storageId;
} else {
  uuid = generateUUID();
  window.localStorage.setItem("uuid", uuid);
}

const service = axios.create({
  timeout: 30 * 1000,
  // 请求是否携带cookie
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    "x-u-app-version": "1.0.0",
    version: "1.0.0",
    "x-u-device-id": uuid,
    "x-u-platform": "web",
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config: CustomInternalAxiosRequestConfig) => {
    const userStore = useUser();
    config.data = {
      ...config.data,
    };
    if (!config.data.server && !config.noNeedServer) {
      config.data.server = userStore.account.server;
    }
    if (config.needToken) {
      config.data.token = userStore.getToken();
      config.data.login = userStore.account.login;
    }
    let action = config.action || config.url || "";
    if (action.startsWith("/")) {
      action = action.slice(1);
    }
    const networkStore = useNetwork();
    let baseURL = "";
    switch (config.urlType) {
      case "admin":
        baseURL =
          import.meta.env.MODE === "development"
            ? import.meta.env.VITE_HTTP_BASE_URL_admin
            : import.meta.env.VITE_HTTP_URL_admin;
        break;
      default:
        baseURL =
          import.meta.env.MODE === "development"
            ? import.meta.env.VITE_HTTP_BASE_URL_client
            : networkStore.currentNode?.webApi;
        break;
    }
    config.url = baseURL + config.url;
    let d;
    if (baseURL.indexOf("120.79.186.23") > -1) {
      // js加密
      d = encrypt(JSON.stringify(config.data));
    } else {
      // Node加密
      d = aes_encrypt(action, JSON.stringify(config.data));
    }
    const p = {
      action,
      d,
    };
    console.log("request----", { currentNode: networkStore.currentNode, url: config.url, data: config.data, p });
    config.data = JSON.stringify(p);
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const { data, config } = response;
    if (data.err === 0) {
      ifTokenError = false;
      if (config.url && config.url.indexOf("120.79.186.23") > -1) {
        // js解密
        data.data = JSON.parse(decrypt(data.data));
      } else {
        // Node解密
        const action = JSON.parse(config.data).action;
        data.data = JSON.parse(aes_decrypt(action, data.data));
      }
      console.log("response....", { url: response.config.url, data });
      return response;
    }
    if (data.err === 1 && data.errmsg.includes("invalid token")) {
      const userStore = useUser();
      userStore.clearToken();
      userStore.loginInfo = null;

      if (!ifTokenError) {
        Modal.warning({
          title: 'waring',
          content: 'data.errmsg',
          onOk() {
            window.location.replace(window.location.origin + "/login");
          },
        });
      }
      ifTokenError = true;
      return Promise.reject(data);
    }
    notification["error"]({
      message: "error",
      description: data.errmsg || data.err || "response error",
    });
    return Promise.reject(data);
  },
  (err) => {
    const res = err.response;
    if (res.data) {
      notification["error"]({
        message: "request error",
        description: res.data.errmsg || err.message || 'something error',
      });
      return Promise.reject(err);
    }
    if (res.status) {
      notification["error"]({
        message: err.name || "request error",
        description: err.message || `statusCode: ${res.status}`,
      });
      return Promise.reject(err);
    }
    // // 根据返回的http状态码做不同的处理，比如错误提示等 TODO
    // switch (status) {
    //   case 401:
    //     // 鉴权失败
    //     break;
    //   case 403:
    //     // 没有权限
    //     break;
    //   case 500:
    //     // 服务端错误
    //     break;

    //   default:
    //     break;
    // }
    return Promise.reject(err);
  }
);

// 封装一层以更好的统一定义接口返回的类型
const request = <T>(
  config: CustomAxiosRequestConfig
): Promise<CustomResponseType<T>> => {
  return new Promise((resolve, reject) => {
    service
      .request<CustomResponseType<T>>(config)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err: Error | AxiosError) => {
        reject(err);
      });
  });
};

export default request;
