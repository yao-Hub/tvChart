import axios, {
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { remove } from "lodash";
import type { CustomResponseType } from "#/axios";
import { encrypt, decrypt } from "utils/DES/JS";
import { aes_decrypt, aes_encrypt } from "utils/DES/Node";
import { notification, Modal } from "ant-design-vue";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

type reqConfig = InternalAxiosRequestConfig<any> & {
  needToken?: boolean;
  noNeedServer?: boolean;
  action?: string;
  urlType?: string;
  needLogin?: boolean;
};
type resConfig = AxiosRequestConfig<any> & {
  needToken?: boolean;
  noNeedServer?: boolean;
  action?: string;
  urlType?: string;
  needLogin?: boolean;
};

const tokenErrorList: string[] = [];

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

const ifLocal = import.meta.env.MODE === "development";
const jsUrl = "120.79.186.23";

const service = axios.create({
  timeout: 30 * 1000,
  // 请求是否携带cookie
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    // "x-u-app-version": "1.0.0",
    // version: "1.0.0",
    // "x-u-device-id": uuid,
    // "x-u-platform": "web",
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config: reqConfig) => {
    const userStore = useUser();
    config.data = {
      ...config.data,
    };
    if (!config.data.server && !config.noNeedServer) {
      config.data.server = userStore.account.server;
    }
    if (config.needToken) {
      config.data.token = userStore.token || userStore.getToken();
      config.data.login = userStore.account.login;
    }
    if (config.needLogin) {
      config.data.login = userStore.account.login;
    }
    let action = config.action || config.url || "";
    if (action.startsWith("/")) {
      action = action.slice(1);
    }
    let baseURL = "";
    const networkStore = useNetwork();
    const webApi = networkStore.currentNode?.webApi;
    function changeLocalUrl(str: string) {
      return str
        .replace(/^https?:\/\//, "-")
        .replace(/\./g, "-")
        .replace(/:/g, "-");
    }
    const baseClientUrl =
      import.meta.env.VITE_HTTP_BASE_URL_client +
      `${webApi ? changeLocalUrl(webApi) : ""}`;
    switch (config.urlType) {
      case "admin":
        baseURL = ifLocal
          ? import.meta.env.VITE_HTTP_BASE_URL_admin
          : import.meta.env.VITE_HTTP_URL_admin;
        break;
      default:
        baseURL = ifLocal ? baseClientUrl : webApi || "";
        break;
    }
    config.url = baseURL + config.url;
    let d;
    if (
      (baseURL && baseURL.includes(jsUrl)) ||
      (webApi && webApi.includes(jsUrl) && config.urlType !== "admin")
    ) {
      // js加密
      d = encrypt(JSON.stringify(config.data));
    } else {
      config.headers["x-u-platform"] = "web";
      config.headers["x-u-app-version"] = "1.0.0";
      config.headers["version"] = "1.0.0";
      config.headers["x-u-device-id"] = uuid;
      // Node加密
      d = aes_encrypt(action, JSON.stringify(config.data));
    }
    const p = {
      action,
      d,
    };
    console.log("request----", {
      currentNode: networkStore.currentNode,
      url: config.url,
      data: config.data,
      p,
    });
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
      remove(tokenErrorList, (url) => config.url === url);
      if (data.data) {
        const networkStore = useNetwork();
        const webApi = networkStore.currentNode?.webApi;
        if (
          (config.url && config.url.includes(jsUrl)) ||
          // @ts-ignorets
          (webApi && webApi.includes(jsUrl) && config.urlType !== "admin")
        ) {
          // js解密
          data.data = JSON.parse(decrypt(data.data));
        } else {
          // Node解密
          const action = JSON.parse(config.data).action;
          data.data = JSON.parse(aes_decrypt(action, data.data));
        }
      }
      console.log("response....", { url: response.config.url, data });
      return response;
    }
    if (
      data.err === 1 &&
      data.errmsg &&
      typeof data.errmsg === "string" &&
      data.errmsg.includes("invalid token")
    ) {
      if (config.url) {
        tokenErrorList.push(config.url);
      }
      if (tokenErrorList.length === 1) {
        Modal.confirm({
          title: "error",
          content: data.errmsg,
          okText: "重新登陆",
          onOk() {
            const userStore = useUser();
            userStore.clearToken();
            userStore.loginInfo = null;
            remove(tokenErrorList);
            window.location.replace(window.location.origin + "/login");
          },
        });
      }
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
    if (res && res.data) {
      notification["error"]({
        message: "request error",
        description: res.data.errmsg || err.message || "something error",
      });
      return Promise.reject(err);
    }
    if (res && res.status) {
      notification["error"]({
        message: err.name || "request error",
        description: err.message || `statusCode: ${res.status}`,
      });
      return Promise.reject(err);
    }
    return Promise.reject(err);
  }
);

// 封装一层以更好的统一定义接口返回的类型
const request = <T>(config: resConfig): Promise<CustomResponseType<T>> => {
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
