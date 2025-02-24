import { ElMessage, ElNotification } from "element-plus";

import type { CustomResponseType } from "#/axios";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

import { addCancelTokenSource, cancelAllRequests } from "./axiosCancel";

import eventBus from "utils/eventBus";

import { decrypt, encrypt } from "utils/DES/JS";
import { generateUUID } from "@/utils/common";

import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";
import { useVersion } from "@/store/modules/version";
import { useTheme } from "@/store/modules/theme";

import i18n from "@/language/index";
const t = i18n.global.t;

interface IOption {
  noNeedToken?: boolean;
  noNeedServer?: boolean;
  action?: string;
  urlType?: string;
  needLogin?: boolean;
  noBeCancel?: boolean;
  noNeedEncryption?: boolean;
}

type reqConfig = InternalAxiosRequestConfig<any> & IOption;
type resConfig = AxiosRequestConfig<any> & IOption;

const handleTokenErr = () => {
  cancelAllRequests();
  eventBus.emit("go-login");
};

const ifLocal = import.meta.env.MODE === "development";
const nowLocale = i18n.global.locale.value;
const LOCALE_MAP: Record<string, string> = {
  zh: "zh-cn",
  en: "en-us",
  zhTw: "zh-hk",
};
const acceptLanguage = LOCALE_MAP[nowLocale];

const service = axios.create({
  timeout: 30 * 1000,
  // 请求是否携带cookie
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    "x-u-platform": "web",
    // @ts-ignore
    "x-u-app-version": _VERSION_,
    // @ts-ignore
    "x-u-device-type": __OS_PLATFORM__,
    // @ts-ignore
    "x-u-device-info": _OS_RELEASE_,
    // @ts-ignore
    "x-u-device-model": _OS_HOSTNAME_,
    "accept-language": acceptLanguage,
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config: reqConfig) => {
    const versionStore = useVersion();
    const themeStore = useTheme();
    config.headers["x-u-device-id"] = versionStore.getDeviceId();
    config.headers["x-u-app-theme"] = themeStore.getSystemTheme();

    if (!config.noBeCancel) {
      const source = axios.CancelToken.source();
      addCancelTokenSource(source);
      config.cancelToken = source.token;
    }

    config.data = {
      ...config.data,
      req_id: generateUUID(),
      req_time: new Date().getTime(),
    };

    const userStore = useUser();
    if (!config.data.server && !config.noNeedServer) {
      config.data.server = userStore.account.server;
    }
    if (!config.data.token && !config.noNeedToken) {
      config.data.token = userStore.account.token;
    }
    if (!config.data.login && config.needLogin) {
      config.data.login = userStore.account.login;
    }
    let action = config.action || config.url || "";
    if (action.startsWith("/")) {
      action = action.slice(1);
    }
    if (config.urlType && config.urlType === "admin") {
      const actionList = action.split("/");
      actionList.splice(0, 1);
      action = actionList.join("/");
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
    if (!config.noNeedEncryption) {
      const p = {
        action,
        d: encrypt(JSON.stringify(config.data)),
      };
      console.log("request----", {
        url: config.url,
        data: config.data,
      });
      config.data = JSON.stringify(p);
    }
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const data = response.data;
    const config: resConfig = response.config;
    if (data.err === 0) {
      if (data.data && !config.noNeedEncryption) {
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
      handleTokenErr();
      return Promise.reject(data);
    }

    ElNotification({
      message: t(data.errmsg || "error"),
      type: "error",
    });
    return Promise.reject(data);
  },
  (err) => {
    const res = err.response;
    if (err.code === "ECONNABORTED") {
      ElMessage.error("request timeout");
      return Promise.reject(err);
    }
    if (res && res.data) {
      if (res.data.errmsg && res.data.errmsg.includes("invalid token")) {
        handleTokenErr();
        return Promise.reject(err);
      }
      ElNotification({
        message: t(res.data.errmsg || res.data.msg) || res.data.msg || "error",
        type: "error",
      });
      return Promise.reject(err);
    }
    if (res && res.status) {
      ElNotification({
        message: `statusCode: ${res.status}`,
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
