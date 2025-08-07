import { ElMessage, ElNotification } from "element-plus";

import type { CustomResponseType } from "#/axios";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

// import { addCancelTokenSource, cancelAllRequests } from "./axiosCancel";

import eventBus from "utils/eventBus";

import { decrypt, encrypt } from "utils/DES/JS";
import { generateUUID } from "@/utils/common";
import { adminHttpIndexedDB } from "utils/IndexedDB/adminHttpDatabase";

import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";
import { useSystem } from "@/store/modules/system";
import { useTheme } from "@/store/modules/theme";

import i18n from "@/language/index";
import { cloneDeep } from "lodash";
import { useDialog } from "@/store/modules/dialog";
const t = i18n.global.t;

interface IOption {
  noNeedToken?: boolean;
  noNeedServer?: boolean;
  action?: string;
  urlType?: string;
  needLogin?: boolean;
  noBeCancel?: boolean;
  customData?: boolean;
  isNotSaveDB?: boolean;
}

type reqConfig = InternalAxiosRequestConfig<any> & IOption;
type resConfig = AxiosRequestConfig<any> & IOption;

const errorTokenList = ["invalid token", "disable login", "disable group"];
function handleTokenErr() {
  // cancelAllRequests();
  eventBus.emit("go-login");
}

const LOCALE_MAP: Record<string, string> = {
  zh: "zh-cn",
  en: "en-us",
  zhTw: "zh-hk",
};

const service = axios.create({
  timeout: 30 * 1000,
  // 请求是否携带cookie
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    "x-u-platform": "web",
    "x-u-app-version": _VERSION_,
    "x-u-app-market": "official_website",
  },
});

// 请求拦截器
service.interceptors.request.use(
  async (config: reqConfig) => {
    const systemStore = useSystem();
    const themeStore = useTheme();
    if (!systemStore.systemInfo) {
      await systemStore.getSystemInfo();
    }
    const acceptLanguage = LOCALE_MAP[i18n.global.locale.value];

    config.headers["accept-language"] = acceptLanguage;
    config.headers["x-u-device-id"] = systemStore.systemInfo!.deviceId;
    config.headers["x-u-device-type"] = systemStore.systemInfo!.platform;
    config.headers["x-u-device-info"] = systemStore.systemInfo!.deviceInfo;
    config.headers["x-u-device-model"] = systemStore.systemInfo!.deviceModel;
    config.headers["x-u-device-brand"] = systemStore.systemInfo!.deviceBrand;
    config.headers["x-u-app-theme"] = themeStore.getSystemTheme();

    // 请求地址
    let baseURL = "";
    const webApi = useNetwork().currentNode?.webApi;

    // admin地址
    const ADMIN_URL = import.meta.env.VITE_HTTP_URL_admin;

    if (config.urlType && config.urlType === "admin") {
      baseURL = ADMIN_URL;
    } else {
      baseURL = webApi;
    }

    // action
    let action = config.url?.replace("/admin-api/", "");
    if (config.action) {
      action = config.action;
    }
    if (action?.startsWith("/")) {
      action = action.slice(1);
    }

    // 最终请求地址
    config.url = baseURL + config.url;

    // 请求cancel
    // if (!config.noBeCancel) {
    //   const source = axios.CancelToken.source();
    //   addCancelTokenSource(source);
    //   config.cancelToken = source.token;
    // }

    // 请求数据处理
    if (!config.customData) {
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
  // 状态码正常返回200
  (response) => {
    const cloneRes = cloneDeep(response);

    const resData = response.data;
    const config: resConfig = response.config;

    if (resData.err === 0 || resData.code === 0) {
      if (resData.data) {
        resData.data = JSON.parse(decrypt(resData.data));
      }

      // admin的接口返回存储到indexedDB中
      if (config.urlType === "admin" && !config.isNotSaveDB) {
        // 解析请求数据
        const configData = JSON.parse(config.data);
        const ded = JSON.parse(decrypt(configData.d));
        const { req_id, req_time, token, ...reqData } = ded;
        const stoReqData = encrypt(JSON.stringify(reqData));
        (async () => {
          try {
            const obj = {
              id: req_id,
              url: config.url!,
              resData: JSON.stringify(cloneRes),
              reqData: stoReqData,
              timeStamp: Date.now(),
            };
            await adminHttpIndexedDB.atomicUpsert(
              { url: config.url!, reqData: stoReqData },
              obj
            );
          } catch (error) {
            console.error("IndexedDB存储失败", error);
          }
        })();
      }
      console.log("response....", { url: config.url, data: resData });
      return response;
    }

    if (
      resData.err !== 0 &&
      resData.errmsg &&
      typeof resData.errmsg === "string" &&
      errorTokenList.includes(resData.errmsg)
    ) {
      handleTokenErr();
    }

    ElNotification({
      message: t(resData.errmsg || "error"),
      type: "error",
      zIndex: useDialog().getMaxZIndex(),
    });
    return Promise.reject(resData);
  },
  // 状态码!===200
  async (err) => {
    if (err.status === 401) {
      ElNotification({
        message: t("invalid token"),
        type: "error",
        zIndex: useDialog().getMaxZIndex(),
      });
      handleTokenErr();
      return Promise.reject(err);
    }

    if (err.config.urlType === "admin" && !err.config.isNotSaveDB) {
      const configData = JSON.parse(err.config.data);
      const ded = JSON.parse(decrypt(configData.d));
      const { req_id, req_time, token, ...reqData } = ded;
      const stoReqData = encrypt(JSON.stringify(reqData));
      const searchData = { url: err.config.url!, reqData: stoReqData };
      const cacheData: any = await adminHttpIndexedDB.findByCondition(
        searchData
      );
      if (cacheData) {
        const stoData = cacheData.pop();
        const resData = JSON.parse(stoData.resData);
        const serverData = resData.data.data;
        const deData = JSON.parse(decrypt(serverData));
        const result = {
          err: 0,
          errmsg: "success",
          data: deData,
        };
        return Promise.resolve({
          ...resData,
          data: result,
        });
      }
    }

    if (err.code === "ECONNABORTED") {
      ElMessage.error("request timeout");
      return Promise.reject(err);
    }

    const res = err.response;
    if (res && res.data) {
      if (res.data.errmsg && errorTokenList.includes(res.data.errmsg)) {
        handleTokenErr();
      }
      ElNotification({
        message: t(
          res.data.errmsg || res.data.msg || res.data.error || "server error"
        ),
        type: "error",
        zIndex: useDialog().getMaxZIndex(),
      });
      return Promise.reject(err);
    }
    if (res && (res.status || res.code)) {
      ElNotification({
        message: `statusCode: ${res.status || res.code}`,
        type: "error",
        zIndex: useDialog().getMaxZIndex(),
      });
      return Promise.reject(err);
    }
    ElMessage.error(err);
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
