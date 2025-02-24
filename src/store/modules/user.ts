import { defineStore } from "pinia";

import i18n from "@/language/index";
import { ElMessage } from "element-plus";
import { assign, debounce } from "lodash";
import CryptoJS from "utils/AES";

import { Login, UserInfo, loginInfo, refresh_token } from "api/account";
import { round } from "utils/common";

import { computed, reactive } from "vue";
import { useNetwork } from "./network";
import { useOrder } from "./order";
import { useSocket } from "./socket";

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
    const nowMargin = margin.value === "-" ? 0 : margin.value;
    if (equity.value !== "-") {
      return round(Number(equity.value) - Number(nowMargin), 2);
    }
    return "-";
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

  const Logout = () => {
    changeCurrentAccountOption({
      ifLogin: false,
    });
  };

  const getLoginInfo = debounce(
    async (params?: { emitSocket?: boolean }) => {
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
    },
    1200,
    { leading: true }
  );

  const addAccount = (data: any) => {
    state.accountList.forEach((item: any) => {
      item.ifLogin = false;
    });
    let index = state.accountList.findIndex(
      (e: any) => e.login === data.login && e.server === data.server
    );
    if (index === -1) {
      state.accountList.push(data);
    } else {
      assign(state.accountList[index], data);
    }
    storageAccount();
  };

  const removeAccount = (info: any) => {
    const { server, login } = info;
    const index = state.accountList.findIndex(
      (e) => e.server === server && e.login === login
    );
    if (index !== -1) {
      state.accountList.splice(index, 1);
      storageAccount();
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
    if (callback) {
      callback({ ending: false, success: false });
    }
    const networkStore = useNetwork();
    networkStore.server = updata.server;
    const nodeList = await networkStore.getNodes(updata.server);
    if (nodeList.length === 0) {
      const t = i18n.global.t;
      ElMessage.info(t("tip.networkNodeNotFound"));
      return Promise.reject();
    }
    try {
      // 选择连接延迟最低的网络节点
      const delayList = await networkStore.getNodesDelay();
      if (delayList.length) {
        const timeList = delayList.map((item) => item.delay);
        // 排序
        timeList.sort((a, b) => a - b);
        const process = (index: number) => {
          if (index >= timeList.length) {
            if (callback) {
              callback({ ending: true, success: false });
            }
            return;
          }
          const time = timeList[index];
          const webApi = delayList.find((e) => e.delay === time)?.url;
          const nodeName = nodeList.find((e) => e.webApi === webApi)?.nodeName;
          if (nodeName) {
            networkStore.nodeName = nodeName;
            const socketStore = useSocket();
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
              .catch(() => {
                process(index + 1);
              });
            return;
          }
        };
        process(0);
      } else {
        if (callback) {
          callback({ ending: true, success: false });
        }
      }
    } catch (error) {
      if (callback) {
        callback({ ending: true, success: false });
      }
      return Promise.reject();
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
    Logout,
    getLoginInfo,
    addAccount,
    removeAccount,
    login,
    refreshToken,
    $reset,
  };
});
