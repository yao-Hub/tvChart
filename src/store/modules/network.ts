import { defineStore } from "pinia";
import {
  queryTradeLine,
  resQueryTradeLine,
  resQueryNode,
  queryNode,
} from "api/account/index";
import { useUser } from "./user";

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
      const userStore = useUser();
      if (userStore.account) {
        const queryNode = userStore.account.queryNode;
        const server = userStore.account.server;
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
    async getNodes(server: string) {
      const lineCode = this.queryTradeLines.find(
        (e) => e.lineName === server
      )?.lineCode;
      if (lineCode) {
        const res = await queryNode({
          lineCode,
        });
        this.nodeList = res.data;
        return this.nodeList;
      }
      return [];
    },
  },
});
