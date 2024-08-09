import { defineStore } from "pinia";
import CryptoJS from "utils/AES";
import {
  queryTradeLine,
  resQueryTradeLine,
  resQueryNode,
  queryNode,
} from "api/account/index";

interface State {
  nodeName: string;
  nodeList: resQueryNode[];
  queryTradeLines: resQueryTradeLine[];
}

export const useNetwork = defineStore("network", {
  state: (): State => {
    return {
      nodeName: "",
      nodeList: [],
      queryTradeLines: [],
    };
  },

  getters: {
    currentNode: (state) => {
      return state.nodeList.find((e) => e.nodeName === state.nodeName);
    },
  },

  actions: {
    initNode() {
      const account = window.localStorage.getItem("account");
      if (account) {
        const parseAccount = JSON.parse(account);
        const queryNode = CryptoJS.decrypt(parseAccount.queryNode);
        this.nodeName = queryNode;
      }
    },

    // 交易线路
    async getLines() {
      const res = await queryTradeLine({});
      this.queryTradeLines = res.data;
    },

    // 网络节点
    async getNodes(lineCode: string) {
      const res = await queryNode({
        lineCode,
      });
      this.nodeList = res.data;
    },
  },
});
