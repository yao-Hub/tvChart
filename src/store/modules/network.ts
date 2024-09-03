import { defineStore } from "pinia";
import CryptoJS from "utils/AES";
import {
  queryTradeLine,
  resQueryTradeLine,
  resQueryNode,
  queryNode,
} from "api/account/index";

interface State {
  server: string;
  nodeName: string;
  nodeList: resQueryNode[];
  queryTradeLines: resQueryTradeLine[];
}

export const useNetwork = defineStore("network", {
  state: (): State => {
    return {
      server: "",
      nodeName: "",
      nodeList: [],
      queryTradeLines: [],
    };
  },

  getters: {
    currentNode: (state) => {
      return state.nodeList.find((e) => e.nodeName === state.nodeName);
    },
    currentLine: (state) => {
      return state.queryTradeLines.find((e) => e.lineName === state.server);
    },
  },

  actions: {
    async initNode() {
      const account = window.localStorage.getItem("account");
      if (account) {
        const parseAccount = JSON.parse(account);
        const queryNode = CryptoJS.decrypt(parseAccount.queryNode);
        const server = CryptoJS.decrypt(parseAccount.server);
        this.server = server;
        this.nodeName = queryNode;
        await this.getNodes(server);
      }
    },

    // 交易线路
    async getLines() {
      const res = await queryTradeLine({});
      this.queryTradeLines = res.data;
    },

    // 网络节点
    async getNodes(lineName: string) {
      try {
        const lineCode = this.queryTradeLines.find(e => e.lineName === lineName)?.lineCode;
        if (lineCode) {
          const res = await queryNode({
            lineCode,
          });
          this.nodeList = res.data;
          return;
        }
        this.nodeList = [];
      } catch (error) {
        this.nodeList = [];
      }
    },

    changeNode(nodeName: string) {
      this.nodeName = nodeName;
      const account = window.localStorage.getItem("account");
      if (account) {
        const parseAccount = JSON.parse(account);
        const enNode = CryptoJS.encrypt(nodeName);
        parseAccount.queryNode = enNode;
        window.localStorage.setItem("account", JSON.stringify(parseAccount));
      }
    }
  },
});
