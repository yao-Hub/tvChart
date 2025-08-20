import { defineStore } from "pinia";

import i18n from "@/language/index";
import { ElMessage, ElMessageBox } from "element-plus";
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
import { PageEnum } from "@/constants/pageEnum";
import router from "@/router";

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
  timer: ReturnType<typeof setInterval> | null;
  ifGuest: boolean;
}

export const useUser = defineStore("user", () => {
  const state = reactive<IState>({
    accountList: [],
    loginInfo: null,
    timer: null,
    ifGuest: false,
  });

  const account = computed(() => {
    let result = {
      login: "",
      password: "",
      server: "",
      token: "",
      queryNode: "",
    };
    if (state.ifGuest) {
      const storageLogin = localStorage.getItem("guestLogin");
      if (storageLogin) {
        result.login = storageLogin;
      } else {
        localStorage.setItem("guestLogin", "9999999");
      }
    } else {
      const found = state.accountList.find((e) => e.ifLogin);
      result = found || result;
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
    if (margin.value === "-") {
      return "-";
    }
    if (margin.value === 0) {
      return 0;
    }
    if (equity.value !== "-") {
      return round((+equity.value / +margin.value) * 100, 2) + " %";
    }
    return "-";
  });

  const checkIfLogin = () => {
    if (!account.value.token) {
      ElMessageBox.confirm(i18n.global.t("account.notLoggedIn"), "", {
        confirmButtonText: i18n.global.t("account.logIn"),
        cancelButtonText: i18n.global.t("cancel"),
        type: "warning",
      }).then(() => {
        router.replace({ path: PageEnum.LOGIN });
      });
      return false;
    }
    return true;
  };

  const initAccount = () => {
    const stoStr = localStorage.getItem("accountList");
    if (stoStr) {
      const list = JSON.parse(stoStr);
      if (list.length > 0) {
        list.forEach((item: any) => {
          // item.password = CryptoJS.decrypt(item.password); // 解密
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
        // password: CryptoJS.encrypt(item.password), // 加密
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
    let timeout: ReturnType<typeof setInterval> | null = null;
    let lastArgs: IGetInfo | undefined; // 保存最新参数
    let hasExecutedLeading = false; // 标记是否已执行leading

    return async (params?: IGetInfo) => {
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
    const res = await loginInfo({
      login: account.value.login,
    });
    state.loginInfo = res.data;

    // 持仓订单和挂单初始化
    useOrder().state.orderData.marketOrder = res.data.openning_orders || [];
    useOrder().state.orderData.pendingOrder = res.data.pending_orders || [];

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

  const addAccount = (data: any) => {
    state.accountList.forEach((item) => {
      item.ifLogin = false;
    });
    let index = state.accountList.findIndex(
      (e) => +e.login === +data.login && e.server === data.server
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

  const goRegister = () => {
    const target = useNetwork().queryTradeLines.find(
      (e) => e.isOfficial === "1"
    );
    if (target) {
      const server = target.lineName;
      router.push({ name: "register", params: { server } });
    } else {
      ElMessage.warning(i18n.global.t("tip.noSimuServer"));
    }
  };

  type TCallback = ({
    ending,
    success,
    errmsg,
  }: {
    ending?: boolean;
    success?: boolean;
    errmsg?: string;
  }) => void;

  const login = async (
    updata: {
      login: string | number;
      password: string;
      server: string;
      otp_code?: string;
    },
    callback: TCallback
  ) => {
    const t = i18n.global.t;

    const networkStore = useNetwork();
    networkStore.server = updata.server;

    const nodeList = await networkStore.getNodes(updata.server);
    if (nodeList.length === 0) {
      ElMessage.info(t("tip.networkNodeNotFound"));
      callback && callback({ ending: true, success: false });
      return Promise.reject();
    }
    // 选择连接延迟最低的网络节点
    const delayList = await networkStore.getNodesDelay();
    const beginTime = new Date().getTime();
    if (!delayList.length) {
      callback &&
        callback({
          ending: true,
          success: false,
          errmsg: t("tip.NodeDelayError"),
        });
      return Promise.reject();
    }
    // 延迟排序
    const orderList = sortBy(delayList, ["delay"]);
    const process = (index: number) => {
      if (index >= orderList.length) {
        callback({ ending: true, success: false });
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
        socketStore.initMainSocket();
        Login(updata)
          .then((res) => {
            localStorage.setItem("guestLogin", "0");
            state.ifGuest = false;
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
            callback({ ending: true, success: true });
            ElMessage.success(i18n.global.t("loginSucceeded"));
            return;
          })
          .catch((error) => {
            errmsg = get(error, "errmsg") || error;
            const err = get(error, ["err"]);
            logType = "error";
            // 账号密码错误等等的用户错误
            if (err === 205) {
              callback({ ending: true, success: false, errmsg });
              return;
            }
            callback({ ending: false, success: false, errmsg });
            process(index + 1);
          })
          .finally(() => {
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
              server: updata.server,
              logName: "login",
              detail,
              day: dayjs().format("YYYY.MM.DD"),
            };
            logIndexedDB.addData(logData);
          });
      }
    };
    process(0);
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
        server: useNetwork().server,
        time: dayjs().format("HH:mm:ss.SSS"),
        day: dayjs().format("YYYY.MM.DD"),
      };
      logIndexedDB.addData(logData);
      changeCurrentAccountOption({ token: "" });
    }
  };

  // 检查是否为游客登录
  const checkIfGuest = () => {
    const ifGuest = localStorage.getItem("guestLogin");
    state.ifGuest = ifGuest === "1";
    return state.ifGuest;
  };
  // 游客登录
  const guestLogin = () => {
    state.accountList.forEach((item) => (item.ifLogin = false));
    localStorage.setItem("guestLogin", "1");
    storageAccount();
    state.ifGuest = true;
    router.push(PageEnum.CHART);
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
    goRegister,
    login,
    refreshToken,
    guestLogin,
    checkIfGuest,
    checkIfLogin,
    $reset,
  };
});
