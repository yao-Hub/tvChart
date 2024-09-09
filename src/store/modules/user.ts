import { defineStore } from "pinia";
import { message } from "ant-design-vue";
import { pick } from 'lodash'
import CryptoJS from "utils/AES";
import { getLoginInfo, UserInfo, Login, reqLogin } from "api/account/index";
import { useSocket } from "@/store/modules/socket";
import { useNetwork } from "@/store/modules/network";

type Account = Pick<UserInfo, "login" | "password"> & {
  server: string;
};
type AccountListItem = Account & {
  blance: string;
};
interface State {
  account: Account;
  accountList: Array<AccountListItem>;
  loginInfo: UserInfo | null;
  token: string;
}

export const useUser = defineStore("user", {
  state: (): State => ({
    accountList: [],
    account: {
      login: "",
      password: "",
      server: "",
    },
    loginInfo: null,
    token: "",
  }),
  actions: {
    deAccount(params: any) {
      const result: any = {};
      for (const i in params) {
        result[i] = CryptoJS.decrypt(params[i]);
      }
      return result;
    },
    enAccount(params: any) {
      const result: any = {};
      for (const i in params) {
        result[i] = CryptoJS.encrypt(params[i]);
      }
      return result;
    },
    initUser() {
      if (!this.token) {
        this.getToken();
      }
      const account = window.localStorage.getItem("account");
      if (account) {
        const parseAccount = JSON.parse(account);
        this.account = this.deAccount(parseAccount);
      }
      this.setAccountList();
    },
    getToken() {
      let result = "";
      const storageToken = window.localStorage.getItem("token");
      if (storageToken) {
        const parseToken = JSON.parse(storageToken);
        result = CryptoJS.decrypt(parseToken);
      }
      this.token = result;
      return result;
    },
    setToken(token: string) {
      const enToken = CryptoJS.encrypt(token);
      this.token = token;
      window.localStorage.setItem("token", JSON.stringify(enToken));
    },
    clearToken() {
      window.localStorage.removeItem("token");
      this.token = "";
    },
    async getLoginInfo(emitSocket?: boolean) {
      const socketStore = useSocket();
      const res = await getLoginInfo({
        login: this.account.login,
      });
      this.loginInfo = res.data;
      if (emitSocket) {
        socketStore.sendToken(res.data.login, this.getToken());
      }
    },
    setStorageAccount(data: any) {
      this.account = pick(data, ['login' , 'password', 'server']) ;
      window.localStorage.setItem(
        "account",
        JSON.stringify(this.enAccount(data))
      );
    },
    setAccountList() {
      const accountList = window.localStorage.getItem("accountList");
      const list: Array<AccountListItem> = accountList ? JSON.parse(accountList) : [];
      // 解密
      const deList = list.map((item) => this.deAccount(item));
      // 赋值
      const found = deList.find((e) => e.login === this.account.login);
      if (!found) {
        const deItem = {
          ...this.account,
          blance: '-'
        };
        if (this.loginInfo && this.loginInfo.balance) {
          deItem.blance = this.loginInfo.balance.toString();
        }
        deList.push(deItem);
      }
      this.accountList = deList;
      // 加密缓存
      const storageList = deList.map((item) => this.enAccount(item));
      window.localStorage.setItem("accountList", JSON.stringify(storageList));
    },

    async login(updata: reqLogin) {
      const networkStore = useNetwork();
      const socketStore = useSocket();

      const nodeList = networkStore.nodeList;
      if (nodeList.length === 0) {
        return message.info("找不到网络节点");
      }
      for (let i in nodeList) {
        const item = nodeList[i];
        try {
          // 接口节点确定
          networkStore.nodeName = item.nodeName;
  
          // socket地址确定
          socketStore.initSocket();
  
          const res = await Login(updata);
  
          // 缓存token 发送登录状态
          this.setToken(res.data.token);
          socketStore.sendToken(updata.login, res.data.token);
  
          // 缓存登录信息
          this.setStorageAccount({
            ...updata,
            queryNode: item.nodeName
          });
        } catch (error) {
          console.log(error)
          continue;
        }
      }
    }
  },
});
