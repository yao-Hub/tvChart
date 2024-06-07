import { defineStore } from 'pinia'
import { UserInfo } from '#/store'
import CryptoJS from 'utils/AES';

interface State {
  userInfo: UserInfo
}

export const useUser = defineStore('user', {
  state(): State {
    return {
      userInfo: {
        userName: '',
        userId: ''
      },
    }
  },
  actions: {
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
    changeUserName(userInfo: UserInfo) {
      this.userInfo = userInfo
    }
  }
})
