import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import { assign } from "lodash";
import CryptoJS from "utils/AES";
import { loginInfo, UserInfo, Login } from "api/account/index";
import { useSocket } from "@/store/modules/socket";
import { useNetwork } from "@/store/modules/network";
import i18n from "@/language/index";

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
      }
      return result;
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
    logoutCurrentAccount() {
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
      callback?: ({ ending }: { ending: boolean }) => void
    ) {
      if (callback) {
        callback({ ending: false });
      }
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
          this.addAccount({
            ...updata,
            queryNode: item.nodeName,
            token,
            ifLogin: true,
          });
          // 缓存token 发送登录状态
          socketStore.sendToken({ login: updata.login, token });
          ElMessage.success(i18n.global.t("login succeeded"));
          return Promise.resolve();
        } catch (error) {
          errorCount++;
          continue;
        }
      }
      if (errorCount === nodeList.length) {
        return Promise.reject();
      }
      if (callback) {
        callback({ ending: true });
      }
    },
  },
});
