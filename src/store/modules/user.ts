import { defineStore } from 'pinia';
import { UserInfo } from '#/store';
import CryptoJS from 'utils/AES';

interface State {
  account: UserInfo
  ifLogin: Boolean
}

export const useUser = defineStore('user', {
  state(): State {
    return {
      account: {
        username: '',
        password: ''
      },
      ifLogin: false
    }
  },
  actions: {
    initUser() {
      this.ifLogin = !!this.getToken();
      const account = window.localStorage.getItem('account');
      if (account) {
        const parseAccount = JSON.parse(account);
        this.account.username = CryptoJS.decrypt(parseAccount.username);
        this.account.password = CryptoJS.decrypt(parseAccount.password);
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
  }
})
