import i18n from "@/language/index";
import { ElMessage } from "element-plus";
import { assign } from "lodash";
import { defineStore } from "pinia";
import CryptoJS from "utils/AES";
import { useI18n } from "vue-i18n";

import { Login, loginInfo, UserInfo } from "api/account/index";
import { round } from "utils/common/index";

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
        return accumulator + currentValue.profit;
      }, 0);
      return round(+state.loginInfo.balance + (sum || 0), 2);
    },
    // 预付款
    margin(state) {
      return state.loginInfo?.margin || "-";
    },
    // 可用预付款
    margin_free() {
      if (this.equity !== "-" && this.margin !== "-") {
        return round(Number(this.equity) - Number(this.margin), 2);
      }
      return "-";
    },
    // 预付款水平
    margin_level() {
      if (+this.margin === 0) {
        return 0;
      }
      if (this.equity !== "-" && this.margin !== "-") {
        return round((+this.equity / +this.margin) * 100, 2);
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
        const res = await Promise.any(
          nodeList.map(async (item) => {
            networkStore.nodeName = item.nodeName;
            // socket地址确定
            const res = await Login(updata);
            return Promise.resolve({
              ...updata,
              queryNode: item.nodeName,
              token: res.data.token,
            });
          })
        );
        const socketStore = useSocket();
        socketStore.initSocket();
        const { queryNode, token } = res;
        // 缓存登录信息
        this.addAccount({
          ...updata,
          queryNode,
          token,
          ifLogin: true,
        });
        socketStore.sendToken({ login: updata.login, token });
        if (callback) {
          callback({ ending: true, success: true });
        }
        ElMessage.success(i18n.global.t("loginSucceeded"));
      } catch (error) {
        if (callback) {
          callback({ ending: true, success: false });
        }
        return Promise.reject();
      }
    },
  },
});
