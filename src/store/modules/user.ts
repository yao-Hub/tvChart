import { defineStore } from "pinia";

import i18n from "@/language/index";
import { ElMessage } from "element-plus";
import { assign, get, sortBy } from "lodash";
import CryptoJS from "utils/AES";
import dayjs from "dayjs";

import { Login, UserInfo, loginInfo, refresh_token, Logout } from "api/account";
import { getPort, round } from "utils/common";
import { logIndexedDB } from "utils/IndexedDB/logDatabase";

import { computed, reactive } from "vue";
import { useNetwork } from "./network";
import { useOrder } from "./order";
import { useSocket } from "./socket";
import { useStorage } from "./storage";

interface IAccount {
  login: string;
  server: string;
  token: string;
  password: string;
}
export type AccountListItem = IAccount & {
  currency?: string;
  blance: number | string;
  token: string;
  ifLogin: boolean;
  queryNode: string;
  remember?: boolean;
};
interface IState {
  accountList: Array<AccountListItem>;
  loginInfo: UserInfo | null;
  timer: NodeJS.Timeout | null;
}

export const useUser = defineStore("user", () => {
  const state = reactive<IState>({
    accountList: [],
    loginInfo: null,
    timer: null,
  });

  const account = computed(() => {
    let result = {
      login: "",
      password: "",
      server: "",
      token: "",
      queryNode: "",
    };
    const found = state.accountList.find((e) => e.ifLogin);
    if (found) {
      result = found;
    }
    return result;
  });

  // 净值
  const equity = computed(() => {
    if (!state.loginInfo) {
      return "-";
    }
    const orderStore = useOrder();
    const currentPosition = orderStore.state.orderData.marketOrder || [];
    const sum = currentPosition.reduce((accumulator, currentValue) => {
      return accumulator + +currentValue.profit;
    }, 0);
    return round(+state.loginInfo.balance + (sum || 0), 2);
  });

  // 预付款
  const margin = computed(() => state.loginInfo?.margin || "-");

  // 可用预付款
  const margin_free = computed(() => {
    let result = "-";
    const nowMargin = margin.value === "-" ? 0 : margin.value;
    if (equity.value !== "-") {
      result = round(Number(equity.value) - Number(nowMargin), 2);
    }
    if (+result < 0) {
      return "0.00";
    }
    return result;
  });

  // 预付款比例
  const margin_level = computed(() => {
    const nowMargin = margin.value === "-" ? 0 : margin.value;
    if (nowMargin === 0) {
      return 0;
    }
    if (equity.value !== "-") {
      return round((+equity.value / +nowMargin) * 100, 2) + " %";
    }
    return "-";
  });

  const initAccount = () => {
    const stoStr = localStorage.getItem("accountList");
    if (stoStr) {
      const list = JSON.parse(stoStr);
      if (list.length > 0) {
        list.forEach((item: any) => {
          item.password = CryptoJS.decrypt(item.password); // 解密
          item.token = CryptoJS.decrypt(item.token);
        });
      }
      state.accountList = list;
    }
  };

  const getToken = () => {
    initAccount();
    const found = state.accountList?.find((e: any) => e.ifLogin);
    if (found) {
      return found.token;
    }
    return "";
  };

  const storageAccount = () => {
    const storageList = state.accountList.map((item) => {
      return {
        ...item,
        password: CryptoJS.encrypt(item.password), // 加密
        token: CryptoJS.encrypt(item.token),
      };
    });
    localStorage.setItem("accountList", JSON.stringify(storageList));
  };

  const changeCurrentAccountOption = (option: any) => {
    const found = state.accountList.find((e) => e.ifLogin);
    assign(found, option);
    storageAccount();
  };

  interface IGetInfo {
    emitSocket?: boolean;
    leading?: boolean;
    trailing?: boolean;
    wait?: number;
  }
  const createGetLoginInfo = () => {
    let timeout: NodeJS.Timeout | null = null;
    let lastArgs: IGetInfo | undefined; // 保存最新参数
    let hasExecutedLeading = false; // 标记是否已执行leading

    return async (params?: IGetInfo) => {
      console.log("params", params);
      const leading = params?.leading ?? false;
      const trailing = params?.trailing ?? true;
      const wait = params?.wait ?? 1200;

      lastArgs = params; // 始终保存最新参数

      // 清除之前的计时器
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      // 处理 leading 边缘
      if (leading && !hasExecutedLeading) {
        hasExecutedLeading = true;
        await executeLogic(lastArgs);
      }

      // 设置 trailing 边缘
      if (trailing) {
        timeout = setTimeout(async () => {
          if (!leading || !hasExecutedLeading) await executeLogic(lastArgs);
          hasExecutedLeading = false;
          timeout = null;
        }, wait);
      }
    };
  };

  const getLoginInfo = createGetLoginInfo();

  async function executeLogic(params?: IGetInfo) {
    console.log("executeLogic");
    const res = await loginInfo({
      login: account.value.login,
    });
    state.loginInfo = res.data;
    changeCurrentAccountOption({
      blance: res.data.balance ?? "-",
      currency: res.data.currency ?? "-",
    });
    if (params && params.emitSocket) {
      const socketStore = useSocket();
      socketStore.sendToken({
        login: res.data.login,
        token: account.value.token,
      });
    }
  }

  const addAccount = (data: AccountListItem) => {
    state.accountList.forEach((item) => {
      item.ifLogin = false;
    });
    let index = state.accountList.findIndex(
      (e) => e.login === data.login && e.server === data.server
    );
    if (index === -1) {
      state.accountList.push(data);
    } else {
      assign(state.accountList[index], data);
    }
    storageAccount();
  };

  const removeAccount = (info: AccountListItem) => {
    const { server, login } = info;
    const index = state.accountList.findIndex(
      (e) => e.server === server && e.login === login
    );
    if (index !== -1) {
      state.accountList.splice(index, 1);
      storageAccount();
      useStorage().delUtraderKey(`${login}_${server}`);
    }
  };

  // 一小时调用一次刷新token
  const refreshToken = () => {
    if (state.timer) {
      clearInterval(state.timer);
    }
    state.timer = setInterval(() => refresh_token(), 60 * 60 * 1000);
  };

  type TCallback = ({
    ending,
    success,
  }: {
    ending?: boolean;
    success?: boolean;
  }) => void;

  const login = async (updata: any, callback?: TCallback) => {
    callback && callback({ ending: false, success: false });
    const networkStore = useNetwork();
    networkStore.server = updata.server;
    const nodeList = await networkStore.getNodes(updata.server);
    if (nodeList.length === 0) {
      const t = i18n.global.t;
      ElMessage.info(t("tip.networkNodeNotFound"));
      callback && callback({ ending: true, success: false });
      return Promise.reject();
    }
    // 选择连接延迟最低的网络节点
    const delayList = await networkStore.getNodesDelay();
    const beginTime = new Date().getTime();

    if (delayList.length) {
      // 排序
      const orderList = sortBy(delayList, ["delay"]);
      const process = (index: number) => {
        if (index >= orderList.length) {
          callback && callback({ ending: true, success: false });
          return;
        }
        const webApi = orderList[index].url;
        const nodeName = nodeList.find((e) => e.webApi === webApi)?.nodeName;
        if (nodeName) {
          networkStore.nodeName = nodeName;
          const socketStore = useSocket();
          let logType = "info";
          let errmsg = "";

          // 长连接主socket
          socketStore.initSocket();
          Login(updata)
            .then((res) => {
              const token = res.data.token;
              // 缓存登录信息
              addAccount({
                ...updata,
                queryNode: nodeName,
                token,
                ifLogin: true,
              });
              // 发送登录状态
              socketStore.sendToken({ login: updata.login, token });
              if (callback) {
                callback({ ending: true, success: true });
              }
              ElMessage.success(i18n.global.t("loginSucceeded"));
            })
            .catch((error) => {
              errmsg = get(error, "errmsg") || error;
              const err = get(error, ["err"]);
              logType = "error";
              if (err === 205) {
                if (callback) {
                  callback({ ending: true, success: false });
                }
                return;
              }
              process(index + 1);
            })
            .finally(async () => {
              const endTime = new Date().getTime();
              const ping = endTime - beginTime;
              const detail = `${updata.login}: ${
                logType === "error" ? `login ${errmsg}` : "login"
              } (dc:${
                networkStore.nodeName || "none"
              },ping:${ping}ms,port: ${getPort(webApi || "")})`;
              const logData = {
                id: endTime,
                logType,
                origin: "network",
                time: dayjs().format("HH:mm:ss.SSS"),
                login: updata.login,
                logName: "login",
                detail,
                day: dayjs().format("YYYY.MM.DD"),
              };
              logIndexedDB.addData(logData);
            });
        }
      };
      process(0);
    } else {
      callback && callback({ ending: true, success: false });
    }
  };

  const logout = async () => {
    let logType = "info";
    const beginTime = new Date().getTime();
    try {
      await Logout();
    } catch (error) {
      logType = "error";
    } finally {
      const endTime = new Date().getTime();
      const ping = endTime - beginTime;
      const detail = `${account.value.login}: ${
        logType === "error" ? "logoutFail" : "logout"
      } (dc:${useNetwork().nodeName},ping:${ping}ms,port: ${
        useNetwork().port
      })`;
      const logData = {
        logType,
        origin: "network",
        logName: "logout",
        detail,
        id: endTime,
        login: account.value.login,
        time: dayjs().format("HH:mm:ss.SSS"),
        day: dayjs().format("YYYY.MM.DD"),
      };
      logIndexedDB.addData(logData);
      changeCurrentAccountOption({
        ifLogin: false,
      });
    }
  };

  function $reset() {
    state.accountList = [];
    state.loginInfo = null;
    if (state.timer) {
      clearInterval(state.timer);
    }
    state.timer = null;
  }

  return {
    state,
    account,
    equity,
    margin,
    margin_free,
    margin_level,
    initAccount,
    getToken,
    storageAccount,
    changeCurrentAccountOption,
    logout,
    getLoginInfo,
    executeLogic,
    addAccount,
    removeAccount,
    login,
    refreshToken,
    $reset,
  };
});
