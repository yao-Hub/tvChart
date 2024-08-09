import { defineStore } from "pinia";
import { UserInfo } from "#/store";
import CryptoJS from "utils/AES";
import { getLoginInfo } from "api/account/index";
import { sendToken } from "utils/socket/operation";

interface State {
  account: Pick<UserInfo, "login" | "password"> & { server: string, node: string };
  ifLogin: Boolean;
  loginInfo: UserInfo | null;
  
}

export const useUser = defineStore("user", {
  state: (): State => ({
    account: {
      login: "",
      password: "",
      server: "",
      node: "",
    },
    ifLogin: false,
    loginInfo: null,
  }),
  actions: {
    initUser() {
      this.ifLogin = !!this.getToken();
      const account = window.localStorage.getItem("account");
      if (account) {
        const parseAccount = JSON.parse(account);
        this.account.login = CryptoJS.decrypt(parseAccount.login);
        this.account.password = CryptoJS.decrypt(parseAccount.password);
      }
      if (this.ifLogin) {
        this.getLoginInfo(true);
      }
    },
    getToken() {
      let result = "";
      const storageToken = window.localStorage.getItem("token");
      if (storageToken) {
        const parseToken = JSON.parse(storageToken);
        result = CryptoJS.decrypt(parseToken);
      }
      return result;
    },
    setToken(token: string) {
      const enToken = CryptoJS.encrypt(token);
      window.localStorage.setItem("token", JSON.stringify(enToken));
    },
    clearToken() {
      window.localStorage.removeItem("token");
    },
    async getLoginInfo(emitSocket?: boolean) {
      const res = await getLoginInfo({
        login: this.account.login,
      });
      this.loginInfo = res.data;
      if (emitSocket) {
        sendToken(res.data.login, this.getToken());
      }
    },
  },
});
