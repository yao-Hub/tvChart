import axios, {
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { remove } from "lodash";
import type { CustomResponseType } from "#/axios";
import { encrypt, decrypt } from "utils/DES/JS";
import { ElNotification, ElMessageBox } from "element-plus";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

type reqConfig = InternalAxiosRequestConfig<any> & {
  noNeedToken?: boolean;
  noNeedServer?: boolean;
  action?: string;
  urlType?: string;
  needLogin?: boolean;
};
type resConfig = AxiosRequestConfig<any> & {
  noNeedToken?: boolean;
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
  (config: reqConfig) => {
    const userStore = useUser();
    config.data = {
      ...config.data,
    };
    if (!config.data.server && !config.noNeedServer) {
      config.data.server = userStore.account.server;
    }
    if (!config.noNeedToken) {
      config.data.token = userStore.token || userStore.getToken();
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
    const p = {
      action,
      d: encrypt(JSON.stringify(config.data)),
    };
    console.log("request----", {
      url: config.url,
      data: config.data,
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
        data.data = JSON.parse(decrypt(data.data));
      }
      console.log("response....", { url: config.url, data });
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
        ElMessageBox.confirm(data.errmsg, "error", {
          confirmButtonText: "重新登陆",
          cancelButtonText: "取消",
        }).then(() => {
          const userStore = useUser();
          userStore.clearToken();
          userStore.loginInfo = null;
          remove(tokenErrorList);
          window.location.replace(window.location.origin + "/login");
        });
      }
      return Promise.reject(data);
    }
    ElNotification({
      title: "Error",
      message: data.errmsg || data.err || "response error",
      type: "error",
    });
    return Promise.reject(data);
  },
  (err) => {
    const res = err.response;
    if (res && res.data) {
      ElNotification({
        title: "request Error",
        message: res.data.errmsg || err.message || "something error",
        type: "error",
      });
      return Promise.reject(err);
    }
    if (res && res.status) {
      ElNotification({
        title: err.name || "request error",
        message: err.message || `statusCode: ${res.status}`,
        type: "error",
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
