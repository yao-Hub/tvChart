import { defineStore } from "pinia";
import { get, set } from "lodash";

import { TableTabKey } from "#/order";

import { useNetwork } from "./network";
import { useUser } from "./user";

export interface IState {
  columnsMap: {
    [key in TableTabKey]?: Record<string, number>;
  };
}

export const useStorage = defineStore("storage", {
  state: (): IState => ({
    columnsMap: {},
  }),
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
      }
    },
    clear() {
      localStorage.removeItem("utrader");
    },
    saveMap(value: any) {
      localStorage.setItem("utrader", JSON.stringify(value));
    },
    saveOrderTableColumn(tableKey: TableTabKey, field: string, width: number) {
      if (Object.keys(this.columnsMap).length === 0) {
        this.columnsMap = this.getItem("tableColumns") || {};
      }
      set(this.columnsMap, [tableKey, field], +width.toFixed(0));
      this.setItem("tableColumns", this.columnsMap);
    },
    delUtraderKey(key: string) {
      const storageMap = this.getUtrader();
      const target = get(storageMap, key);
      if (target) {
        delete storageMap[key];
      }
      this.saveMap(storageMap);
    },
    removeNowUserStorage() {
      const login = useUser().account.login;
      const server = useNetwork().server;
      this.delUtraderKey(`${login}_${server}`);
    },
  },
});
