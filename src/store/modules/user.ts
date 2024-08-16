import { defineStore } from "pinia";
import CryptoJS from "utils/AES";
import { getLoginInfo, UserInfo } from "api/account/index";
import { useSocket } from "@/store/modules/socket";

interface State {
  account: Pick<UserInfo, "login" | "password"> & {
    server: string;
  };
  loginInfo: UserInfo | null;
}

export const useUser = defineStore("user", {
  state: (): State => ({
    account: {
      login: "",
      password: "",
      server: "",
    },
    loginInfo: null,
  }),
  actions: {
    async initUser() {
      const account = window.localStorage.getItem("account");
      if (account) {
        const parseAccount = JSON.parse(account);
        this.account.login = CryptoJS.decrypt(parseAccount.login);
        this.account.password = CryptoJS.decrypt(parseAccount.password);
        this.account.server = CryptoJS.decrypt(parseAccount.server);
      }
      await this.getLoginInfo(true);
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
      const socketStore = useSocket();
      const res = await getLoginInfo({
        login: this.account.login,
      });
      this.loginInfo = res.data;
      if (emitSocket) {
        socketStore.sendToken(res.data.login, this.getToken());
      }
    },
  },
});
