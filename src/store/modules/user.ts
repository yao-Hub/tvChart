import i18n from "@/language/index";
import { ElMessage } from "element-plus";
import { assign, findKey } from "lodash";
import { defineStore } from "pinia";
import CryptoJS from "utils/AES";
import { useI18n } from "vue-i18n";

import { Login, loginInfo, UserInfo } from "api/account";
import { round } from "utils/common";

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
interface State {
  accountList: Array<AccountListItem>;
  loginInfo: UserInfo | null;
}

export const useUser = defineStore("user", {
  state: (): State => ({
    accountList: [],
    loginInfo: null,
  }),
  getters: {
    account(state) {
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
    },
    // 净值
    equity(state) {
      if (!state.loginInfo) {
        return "-";
      }
      const orderStore = useOrder();
      const currentPosition = orderStore.orderData.marketOrder || [];
      const sum = currentPosition.reduce((accumulator, currentValue) => {
        return accumulator + +currentValue.profit;
      }, 0);
      return round(+state.loginInfo.balance + (sum || 0), 2);
    },
    // 预付款
    margin(state): string | number {
      return state.loginInfo?.margin || "-";
    },
    // 可用预付款
    margin_free() {
      // @ts-ignore
      const nowMargin = this.margin === "-" ? 0 : this.margin;
      if (this.equity !== "-") {
        return round(Number(this.equity) - Number(nowMargin), 2);
      }
      return "-";
    },
    // 预付款比例
    margin_level() {
      // @ts-ignore
      const nowMargin = this.margin === "-" ? 0 : this.margin;
      if (nowMargin === 0) {
        return 0;
      }
      if (this.equity !== "-") {
        return round((+this.equity / +nowMargin) * 100, 2);
      }
      return "-";
    },
  },
  actions: {
    getToken() {
      this.initAccount();
      const found = this.accountList?.find((e: any) => e.ifLogin);
      if (found) {
        return found.token;
      }
      return "";
    },
    Logout() {
      this.changeCurrentAccountOption({
        ifLogin: false,
      });
    },
    async getLoginInfo(params?: { emitSocket?: boolean }) {
      this.loginInfo = null;
      const res = await loginInfo({
        login: this.account!.login,
      });
      this.loginInfo = res.data;
      this.changeCurrentAccountOption({
        blance: res.data.balance ?? "-",
        currency: res.data.currency ?? "-",
      });
      if (params && params.emitSocket) {
        const socketStore = useSocket();
        socketStore.sendToken({
          login: res.data.login,
          token: this.account.token,
        });
      }
    },

    storageAccount() {
      const storageList = this.accountList.map((item) => {
        return {
          ...item,
          password: CryptoJS.encrypt(item.password), // 加密
          token: CryptoJS.encrypt(item.token),
        };
      });
      localStorage.setItem("accountList", JSON.stringify(storageList));
    },

    initAccount() {
      const stoStr = localStorage.getItem("accountList");
      if (stoStr) {
        const list = JSON.parse(stoStr);
        if (list.length > 0) {
          list.forEach((item: any) => {
            item.password = CryptoJS.decrypt(item.password); // 解密
            item.token = CryptoJS.decrypt(item.token);
          });
        }
        this.accountList = list;
      }
    },

    addAccount(data: any) {
      this.accountList.forEach((item: any) => {
        item.ifLogin = false;
      });
      let index = this.accountList.findIndex(
        (e: any) => e.login === data.login && e.server === data.server
      );
      if (index === -1) {
        this.accountList.push(data);
      } else {
        assign(this.accountList[index], data);
      }
      this.storageAccount();
    },

    changeCurrentAccountOption(option: any) {
      const found = this.accountList.find((e) => e.ifLogin);
      assign(found, option);
      this.storageAccount();
    },

    removeAccount(info: any) {
      const { server, login } = info;
      const index = this.accountList.findIndex(
        (e) => e.server === server && e.login === login
      );
      if (index !== -1) {
        this.accountList.splice(index, 1);
        this.storageAccount();
      }
    },

    async login(
      updata: any,
      callback?: ({
        ending,
        success,
      }: {
        ending?: boolean;
        success?: boolean;
      }) => void
    ) {
      if (callback) {
        callback({ ending: false, success: false });
      }
      const networkStore = useNetwork();
      networkStore.server = updata.server;
      const nodeList = await networkStore.getNodes(updata.server);
      if (nodeList.length === 0) {
        const { t } = useI18n();
        ElMessage.info(t("tip.networkNodeNotFound"));
        return Promise.reject();
      }
      try {
        const socketStore = useSocket();
        // 选择连接延迟最低的网络节点
        socketStore.getDelay(async (params: { ending: boolean }) => {
          if (params.ending) {
            const timeList = Object.values(socketStore.delayMap) as number[];
            const minTime = Math.min(...timeList);
            const uri = findKey(socketStore.delayMap, (o) => o === minTime);
            const nodeName = networkStore.nodeList.find(
              (e) => e.webWebsocket === uri
            )?.nodeName;
            if (nodeName) {
              // 长连接主socket
              socketStore.initSocket();
              networkStore.nodeName = nodeName;
              Login(updata)
                .then((res) => {
                  const token = res.data.token;
                  // 缓存登录信息
                  this.addAccount({
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
                  if (callback) {
                    callback({ ending: true, success: false });
                  }
                });
              return;
            }
            if (callback) {
              callback({ ending: true, success: false });
            }
          }
        });
      } catch (error) {
        if (callback) {
          callback({ ending: true, success: false });
        }
        return Promise.reject();
      }
    },
  },
});
