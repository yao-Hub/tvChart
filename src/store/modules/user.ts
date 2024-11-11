import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import { assign } from "lodash";
import CryptoJS from "utils/AES";
import { loginInfo, UserInfo, Login } from "api/account/index";
import { useSocket } from "@/store/modules/socket";
import { useNetwork } from "@/store/modules/network";
import { useStorage } from "./storage";

type Account = Pick<UserInfo, "login" | "password"> & {
  server: string;
  token: "";
};
type AccountListItem = Account & {
  blance: number | string;
  token: string;
  ifLogin: boolean;
  queryNode: string;
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
      } else if (state.accountList.length > 0) {
        result = state.accountList[0];
      }
      return result;
    },
  },
  actions: {
    getToken() {
      const storageStore = useStorage();
      const list = storageStore.getItem("accountList");
      const found = list?.find((e: any) => e.ifLogin);
      if (found) {
        return found.token;
      }
      return "";
    },
    clearToken() {
      const data = {
        ...this.account,
        token: "",
        ifLogin: false,
      };
      this.handleAccount(data);
    },
    async getLoginInfo(params?: { emitSocket?: boolean }) {
      this.loginInfo = null;
      const res = await loginInfo({
        login: this.account!.login,
      });
      this.loginInfo = res.data;
      this.setbalance();
      if (params && params.emitSocket) {
        const socketStore = useSocket();
        socketStore.sendToken({
          login: res.data.login,
          token: this.account.token,
        });
      }
    },

    storageAccount() {
      const storageStore = useStorage();
      const storageList = this.accountList.map((item) => {
        return {
          ...item,
          password: CryptoJS.encrypt(item.password),
          token: CryptoJS.encrypt(item.token),
        };
      });
      storageStore.setItem("accountList", storageList);
    },

    handleAccount(data?: any) {
      const storageStore = useStorage();
      let list = storageStore.getItem("accountList") || [];
      if (list.length > 0) {
        list = list.map((item: any) => {
          return {
            ...item,
            password: CryptoJS.decrypt(item.password),
            token: CryptoJS.decrypt(item.token),
          };
        });
      }
      if (data) {
        const login = data.login;
        let found = list.find((e: any) => e.login === login);
        if (!found) {
          list.push(data);
        } else {
          assign(found, data);
        }
      }
      this.accountList = list;
      this.storageAccount();
    },
    setbalance() {
      const found = this.accountList.find((e) => e.ifLogin);
      if (found) {
        found.blance = this.loginInfo?.balance || "-";
      }
      this.storageAccount();
    },

    async login(updata: any) {
      const networkStore = useNetwork();
      const socketStore = useSocket();
      networkStore.server = updata.server;
      await networkStore.getNodes(updata.server);
      const nodeList = networkStore.nodeList;
      if (nodeList.length === 0) {
        ElMessage.info("找不到网络节点");
        return Promise.reject();
      }
      let errorCount = 0;
      for (let i in nodeList) {
        const item = nodeList[i];
        try {
          // 接口节点确定
          networkStore.nodeName = item.nodeName;
          // socket地址确定
          socketStore.initSocket();
          const res = await Login(updata);
          const token = res.data.token;
          // 缓存登录信息
          this.handleAccount({
            ...updata,
            queryNode: item.nodeName,
            token,
            ifLogin: true,
          });
          // 缓存token 发送登录状态
          socketStore.sendToken({ login: updata.login, token });
          return Promise.resolve();
        } catch (error) {
          console.log(error);
          errorCount++;
          continue;
        }
      }
      if (errorCount === nodeList.length) {
        return Promise.reject();
      }
    },
  },
});
