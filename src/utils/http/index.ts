import axios, {
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import type { CustomResponseType } from "#/axios";

import { debounce } from "lodash";
import { encrypt, decrypt } from "utils/DES/JS";

import { ElNotification, ElMessageBox, ElMessage } from "element-plus";

import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";
import { useChartInit } from "@/store/modules/chartInit";

import i18n from "@/language/index";

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

let reLogin = false;
let logging = false;

const showTokenConfirm = () => {
  ElMessageBox.confirm(i18n.global.t("invalid token"), "", {
    type: "warning",
    confirmButtonText: i18n.global.t("reLogin"),
    cancelButtonText: i18n.global.t("cancel"),
  }).then(() => {
    reLogin = false;
    window.location.replace(window.location.origin + "/login");
  });
};

const handleTokenErr = debounce(async () => {
  if (reLogin) {
    showTokenConfirm();
    return;
  }
  reLogin = true;
  const userStore = useUser();
  const { login, password, server } = userStore.account;
  try {
    logging = true;
    await userStore.login({
      login,
      password,
      server,
    });
    useChartInit().refresh();
  } catch (e) {
    showTokenConfirm();
  } finally {
    logging = false;
  }
}, 3000);

const ifLocal = import.meta.env.MODE === "development";

const controller = new AbortController();

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
    "x-u-platform": "web",
    // @ts-ignore
    "x-u-app-version": _VERSION_,
    "x-u-device-id": uuid,
    // @ts-ignore
    "x-u-device-type": __OS_PLATFORM__,
    // @ts-ignore
    "x-u-device-info": _OS_RELEASE_,
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config: reqConfig) => {
    if (logging) {
      controller.abort();
    }
    const userStore = useUser();
    config.data = {
      ...config.data,
    };
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
    // console.log("request----", {
    //   url: config.url,
    //   data: config.data,
    // });
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
      config.url && handleTokenErr();
      return Promise.reject(data);
    }

    ElNotification({
      message: i18n.global.t(data.errmsg || "error"),
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
      if (res.data.errmsg.includes("invalid token")) {
        handleTokenErr();
        return Promise.reject(err);
      }
      ElNotification({
        message: i18n.global.t(res.data.errmsg || "error"),
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
