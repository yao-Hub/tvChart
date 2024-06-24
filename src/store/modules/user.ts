import { defineStore } from 'pinia';
import { watch } from 'vue';
import { eq } from 'lodash';
import { UserInfo } from '#/store';
import CryptoJS from 'utils/AES';
import { loginInfo } from 'api/account/index';
import { useChartAction } from '@/store/modules/chartAction';

interface State {
  account: Pick<UserInfo, 'login' | 'password'>
  ifLogin: Boolean
  loginInfo: UserInfo | null
}

export const useUser = defineStore('user', {
  state(): State {
    return {
      account: {
        login: '',
        password: ''
      },
      ifLogin: false,
      loginInfo: null
    }
  },
  actions: {
    async initUser() {
      this.ifLogin = !!this.getToken();
      const account = window.localStorage.getItem('account');
      if (account) {
        const parseAccount = JSON.parse(account);
        this.account.login = CryptoJS.decrypt(parseAccount.login);
        this.account.password = CryptoJS.decrypt(parseAccount.password);
      }
      if (this.ifLogin) {
        this.getLoginInfo();
      }
    },
    getToken() {
      let result = '';
      const storageToken = window.localStorage.getItem('token');
      if (storageToken) {
        const parseToken = JSON.parse(storageToken);
        result = CryptoJS.decrypt(parseToken);
      }
      return result;
    },
    setToken(token: string) {
      const enToken = CryptoJS.encrypt(token);
      window.localStorage.setItem('token', JSON.stringify(enToken));
    },
    clearToken() {
      window.localStorage.removeItem('token');
    },
    async getLoginInfo() {
      const res = await loginInfo({
        login: this.account.login,
      });
      this.loginInfo = res.data;
    }
  }
})

watch(() => useUser().loginInfo, (newVal, oldVal) => {
  const chartActionStore = useChartAction();
  const ifEq = eq(newVal, oldVal);
  if (!ifEq) {
    chartActionStore.createAvatar();
  }
});
