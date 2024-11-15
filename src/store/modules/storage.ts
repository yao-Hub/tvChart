import { defineStore } from "pinia";
import { useNetwork } from "./network";
import { useUser } from "./user";
import { get, set } from "lodash";

export const useStorage = defineStore("storage", {
  actions: {
    getUtrader(): Record<string, any> {
      let result = {};
      const utrader = localStorage.getItem("utrader");
      if (utrader) {
        result = JSON.parse(utrader);
      }
      return result;
    },
    getItem(key: string) {
      const networkStore = useNetwork();
      const userStore = useUser();
      const login = userStore.account?.login;
      const server = networkStore.server;
      const storageMap = this.getUtrader();
      let ls;
      if (login && server) {
        ls = `${login}_${server}`;
        return get(storageMap, [ls, key]);
      }
      const winVal = localStorage.getItem(key);
      if (winVal) {
        return JSON.parse(winVal);
      }
      return null;
    },
    setItem(key: string, value: any) {
      const networkStore = useNetwork();
      const userStore = useUser();
      const login = userStore.account?.login;
      const server = networkStore.server;
      const storageMap = this.getUtrader();
      if (login && server) {
        set(storageMap, [`${login}_${server}`, key], value);
        this.saveMap(storageMap);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    },
    removeItem(key: string) {
      const networkStore = useNetwork();
      const userStore = useUser();
      const login = userStore.account.login;
      const server = networkStore.server;
      const storageMap = this.getUtrader();
      if (login && server) {
        delete storageMap[`${login}_${server}`][key];
        this.saveMap(storageMap);
      } else {
        localStorage.removeItem(key);
      }
    },
    clear() {
      localStorage.removeItem("utrader");
    },
    saveMap(value: any) {
      localStorage.setItem("utrader", JSON.stringify(value));
    },
  },
});
